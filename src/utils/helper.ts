import pkg from "lodash";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { Worker } from "worker_threads";

import {
  CodeBlockLanguage,
  CodeExecutionResult,
  DateFormat,
  ExecutionLimits,
  ExpressionConfig,
  LogicalOperator,
  NodeEdgesCondition,
  NodeResponse,
  NodeType,
} from "../types";
import { ExecutionMemoryError, ExecutionTimeoutError } from "../exceptions";
import {
  DEFAULT_CPU_TIME_MS,
  DEFAULT_MEMORY_LIMIT_KB,
  DEFAULT_TIMEOUT_MS,
  LANGUAGE_CONFIGS,
  PATTERNS,
} from "../constants";
import { isValid, parse, parseISO } from "date-fns";
import { getNextNodeAfterLoop, getNextNodeId } from "../services";
import { resolveFunctions } from "./function-resolver";
const { isNil, isEmpty, isObjectLike, isString, isDate, isNumber, trim } = pkg;

export function evaluateCondition(expression: string, context: Record<string, any>): { status: boolean; value: any } {
  let matchedValue: Record<string, any>[] = [];
  try {
    const parsedExpression = expression.replace(/{{\s*\$\.([\w.]+)\s*}}/g, (_, key) => {
      let value: any = context;
      let keyName: string = "";
      const parts = key.split(".");
      for (const part of parts) {
        value = value?.[part];
        keyName = part;
      }
      matchedValue.push({ key: keyName, value });
      return JSON.stringify(value);
    });
    console.log(`Resolved Expression ${expression} =>`, parsedExpression);

    const fn = new Function(`return (${parsedExpression});`);
    return { status: Boolean(fn()), value: matchedValue };
  } catch (error) {
    console.error("Condition evaluation failed:", error);
    throw error;
  }
}

export function getJson<T>(value: any): T {
  return value as T;
}

export const isNilOrEmpty = (value: any): boolean =>
  isNil(value) || ((isObjectLike(value) || isString(value)) && isEmpty(value));

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolvePath(obj: any, path: string) {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part];
    }
    // Auto-parse JSON strings
    if (typeof acc === "string") {
      try {
        const parsed = JSON.parse(acc);
        if (parsed && typeof parsed === "object" && part in parsed) {
          return parsed[part];
        }
      } catch {}
    }
    return undefined;
  }, obj);
}

function resolveTemplate(value: any, context: any, strict: boolean = false): any {
  if (typeof value === "string") {
    const templateRegex = /\{\{(.*?)\}\}/g;
    let fullString = value.trim();

    // Check if the string is a **single template only**
    if (fullString.match(/^{{\s*.*\s*}}$/)) {
      const key = fullString
        .replace(/^{{\s*/, "")
        .replace(/\s*}}$/, "")
        .trim();
      const raw =
        key.startsWith("$.") || key.startsWith("$")
          ? resolvePath(context, key.replace(/^\$\./, "").replace(/^\$/, ""))
          : context[key];

      // In strict mode, only replace if value exists (not undefined)
      if (strict && raw === undefined) {
        return value; // Return original template string
      }

      return raw;
    }

    // Otherwise, replace templates inside the string and serialize objects/arrays
    return value.replace(templateRegex, (match, expr) => {
      const key = expr.trim();
      const val =
        key.startsWith("$.") || key.startsWith("$")
          ? resolvePath(context, key.replace(/^\$\./, "").replace(/^\$/, ""))
          : context[key];

      // In strict mode, only replace if value exists (not undefined)
      if (strict && val === undefined) {
        return match; // Return original {{ }} template
      }

      if (typeof val === "object") return JSON.stringify(val);
      return val ?? "";
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplate(item, context, strict));
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        result[k] = resolveTemplate(value[k], context, strict);
      }
    }
    return result;
  }

  return value;
}

export function resoleTemplateAndNormalize(value: any, context: any, strict: boolean = false): any {
  const resolved = resolveTemplate(value, context, strict);
  return resolveFunctions(resolved);
}

/**
 * Execute a block of code in any supported language with resource limits.
 */
export const executeCodeBlock = async (
  code: string,
  language: CodeBlockLanguage,
  limits: ExecutionLimits = {},
  input = ""
): Promise<CodeExecutionResult> => {
  const timeoutMs = limits.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const memoryLimitKB = limits.memoryLimitKB ?? DEFAULT_MEMORY_LIMIT_KB;
  const cpuTimeMs = limits.cpuTimeMs ?? DEFAULT_CPU_TIME_MS;

  const startTime = Date.now();

  // JS code runs inside Worker for isolation
  if (language === CodeBlockLanguage.JAVASCRIPT) {
    return await runJsInWorker(code, timeoutMs, startTime);
  }

  // Dynamic language execution via child process
  const config = LANGUAGE_CONFIGS[language];
  if (!config) throw new Error(`Unsupported code block language: ${language}`);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-exec-"));
  const sourceFile = path.join(tempDir, `code${config.fileExtension}`);
  const compiledFile = path.join(tempDir, "output");

  await fs.writeFile(sourceFile, code, "utf-8");

  let execCommand = config.command;
  let execArgs: string[] = [];

  if (config.needsCompilation) {
    const compileResult = await runProcess(
      config.compileCommand!,
      config.compileArgs!(sourceFile, compiledFile),
      timeoutMs,
      memoryLimitKB
    );
    if (!compileResult.success) {
      await cleanup(tempDir);
      throw new Error(`Compilation failed:\n${compileResult.error}`);
    }
    execCommand = compiledFile;
    execArgs = config.runArgs ? config.runArgs(sourceFile) : [];
  } else {
    execArgs = config.runArgs!(sourceFile);
  }

  const result = await runProcess(execCommand, execArgs, timeoutMs, memoryLimitKB, cpuTimeMs, input);
  if (result.error) {
    throw new Error(result.error);
  }

  await cleanup(tempDir);
  return formatExecutionResult(result.success, result.output || result.error, startTime, result);
};

const runJsInWorker = (code: string, timeoutMs: number, startTime?: number): Promise<CodeExecutionResult> => {
  return new Promise((resolve, reject) => {
    const workerCode = `
      const { parentPort } = require('worker_threads');

      (async () => {
        try {
          let output = '';
          const originalLog = console.log;
          console.log = (...args) => {
            output += args.join(' ') + '\\n';
            originalLog(...args);
          };

          // run user code in isolated scope
          let result;
          try {
            result = await (async () => {
              ${code}
            })();
          } catch (err) {
            parentPort.postMessage({ success: false, error: err.message });
            return;
          }

          parentPort.postMessage({ success: true, result, output });
        } catch (err) {
          parentPort.postMessage({ success: false, error: err.message });
        }
      })();
    `;
    const worker = new Worker(workerCode, { eval: true });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new ExecutionTimeoutError());
    }, timeoutMs);

    worker.on("message", (msg: any) => {
      clearTimeout(timeout);
      if (msg.success) resolve(formatExecutionResult(true, JSON.stringify(msg.result, null, 2), startTime));
      else reject(new Error(msg.error));
    });

    worker.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

/**
 * Run a language command or compiled binary with resource limits.
 */
const runProcess = (
  command: string,
  args: string[],
  timeoutMs: number,
  memoryLimitKB: number,
  cpuTimeMs?: number,
  input = ""
): Promise<CodeExecutionResult> => {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let finalCommand = command;
    let finalArgs = args;

    if (platform === "linux" || platform === "darwin") {
      const cpuSec = Math.ceil((cpuTimeMs ?? timeoutMs) / 1000);
      const ulimitCmd =
        platform === "linux" ? `ulimit -v ${memoryLimitKB} && ulimit -t ${cpuSec}` : `ulimit -t ${cpuSec}`;
      finalCommand = "sh";
      finalArgs = ["-c", `${ulimitCmd} && ${command} ${args.join(" ")}`];
    }

    const proc = spawn(finalCommand, finalArgs, { stdio: "pipe" });
    let stdout = "",
      stderr = "";
    let timedOut = false;
    let memoryExceeded = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    if (input && proc.stdin) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.stdout?.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > memoryLimitKB * 1024) {
        // Simple memory limit check
        memoryExceeded = true;
        proc.kill("SIGKILL");
      }
    });

    proc.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (/MemoryError|Out of memory|Cannot allocate memory/i.test(stderr)) {
        memoryExceeded = true;
        proc.kill("SIGKILL");
      }
    });

    proc.on("close", (exitCode, signal) => {
      clearTimeout(timeout);

      if (timedOut) return reject(new ExecutionTimeoutError());
      if (memoryExceeded) return reject(new ExecutionMemoryError());

      // Map OS signals to exceptions
      if (exitCode === 137 || signal === "SIGKILL") {
        return reject(new ExecutionMemoryError("Process killed - likely exceeded memory limit"));
      }
      if (exitCode === 143 || signal === "SIGTERM") {
        return reject(new ExecutionTimeoutError("Process killed - likely exceeded CPU/time limit"));
      }

      const success = exitCode === 0;
      if (!success) return reject(new Error(stderr.trim() || "Unknown execution error"));
      resolve(formatExecutionResult(true, stdout.trim()));
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

/**
 * Format and normalize execution result output.
 */
const formatExecutionResult = (
  success: boolean,
  output = "",
  startTime?: number,
  extra: Partial<CodeExecutionResult> = {}
): CodeExecutionResult => {
  let parsedOutput = output.trim();

  // Try to parse JSON from the last line of output
  if (success && parsedOutput) {
    const lines = parsedOutput.split("\n");
    const lastLine = lines[lines.length - 1].trim();

    try {
      // Check if last line is valid JSON
      if (
        (lastLine.startsWith("{") && lastLine.endsWith("}")) ||
        (lastLine.startsWith("[") && lastLine.endsWith("]"))
      ) {
        parsedOutput = JSON.parse(lastLine);
      }
    } catch {
      // Not JSON, keep as string
    }
  }

  return {
    ...extra,
    success,
    output: parsedOutput,
    error: success ? undefined : output.trim(),
    exitCode: extra.exitCode ?? (success ? 0 : 1),
    executionTime: startTime ? Date.now() - startTime : extra.executionTime ?? 0,
  };
};

/**
 * Cleanup temporary directory
 */
const cleanup = async (tempDir: string) => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error("Failed to cleanup temp directory:", error);
  }
};

/**
 * Parses any supported date/time input into a valid Date object.
 * Supports all formats defined in DateFormat enum, including ISO and UNIX timestamps.
 *
 * @param value - Date string, timestamp (ms/sec), or Date instance
 * @throws {Error} If the input cannot be parsed into a valid Date
 * @returns A valid JavaScript Date object
 */
export const parseDateValue = (value: string | number | Date): Date => {
  // Guard: null/undefined check
  if (value == null) {
    throw new Error("Invalid Date: value is null or undefined");
  }

  // Fast path: Already a Date instance
  if (isDate(value)) {
    if (isValid(value)) return value;
    throw new Error("Invalid Date instance");
  }

  // Fast path: Numeric timestamp
  if (isNumber(value)) {
    const isLikelySeconds = value < 10_000_000_000;
    const date = new Date(isLikelySeconds ? value * 1000 : value);
    if (isValid(date)) return date;
    throw new Error(`Invalid Date: numeric timestamp "${value}"`);
  }

  // Must be a string beyond this point
  if (!isString(value)) {
    throw new Error(`Invalid Date: expected string, received ${typeof value}`);
  }

  const trimmed = trim(value);
  if (!trimmed) {
    throw new Error("Invalid Date: empty string");
  }

  // Try numeric string timestamps (exactly 10 or 13+ digits)
  if (PATTERNS.timestamp.test(trimmed)) {
    const num = Number(trimmed);
    const date = trimmed.length === 10 ? new Date(num * 1000) : new Date(num);
    if (isValid(date)) return date;
  }

  // Try ISO 8601
  let date = parseISO(trimmed);
  if (isValid(date)) return date;

  // Try all DateFormat enum formats (exclude non-date-fns tokens)
  const excludedFormats = new Set([
    DateFormat.UNIX, // "t" - not a date-fns format
    DateFormat.UNIX_MS, // "T" - not a date-fns format
  ]);
  const candidateFormats = Object.values<DateFormat>(DateFormat).filter((fmt) => !excludedFormats.has(fmt));

  for (const fmt of candidateFormats) {
    date = parse(trimmed, fmt, new Date());
    if (isValid(date)) return date;
  }

  // Try native JS Date parser (RFC 2822, locale formats)
  date = new Date(trimmed);
  if (isValid(date)) return date;

  // No valid parse found
  throw new Error(`Invalid Date: unable to parse "${value}"`);
};

/**
 * Returns the next node ID based on the node type and its execution result.
 */
export const resolveNextNodeId = async <T extends NodeType>(
  nodeId: string,
  type: T,
  groupId: string | null,
  nodeResult: NodeResponse<T>
): Promise<string | null> => {
  switch (type) {
    case NodeType.CONDITIONAL: {
      const { expressionResult } = nodeResult as NodeResponse<NodeType.CONDITIONAL>;
      return getNextNodeId(
        nodeId,
        expressionResult ? NodeEdgesCondition.ON_TRUE : NodeEdgesCondition.ON_FALSE,
        groupId
      );
    }

    case NodeType.SWITCH: {
      const { matchedCaseLabel } = nodeResult as NodeResponse<NodeType.SWITCH>;
      return getNextNodeId(nodeId, matchedCaseLabel, groupId);
    }

    case NodeType.LOOP:
      return getNextNodeAfterLoop(nodeId);

    default:
      return getNextNodeId(nodeId, NodeEdgesCondition.NONE, groupId);
  }
};

export function mergeConditions(conditions: ExpressionConfig[]): string {
  const combinedExpression = conditions
    .map((cond) => cond.expression)
    .reduce((acc, expr, idx) => {
      if (idx === 0) return expr;
      const operator = conditions[idx].operator ?? LogicalOperator.AND; // default AND
      return `(${acc}) ${operator} (${expr})`;
    }, "");
  return combinedExpression;
}
