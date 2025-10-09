import pkg from "lodash";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { LANGUAGE_CONFIGS } from "../constants";
import { CodeBlockLanguage, CodeExecutionResult } from "../types";
const { isEmpty, isNil, isObjectLike, isString } = pkg;

export function evaluateCondition(
  expression: string,
  context: Record<string, any>
): { status: boolean; value: any } {
  let variableValue = undefined;
  try {
    let value: any = context;
    const parsedExpression = expression.replace(/{{\s*\$\.([\w.]+)\s*}}/g, (_, key) => {
      const parts = key.split(".");
      for (const part of parts) {
        value = value?.[part];
      }
      variableValue = value;
      return JSON.stringify(value);
    });
    console.log(`Resolved Expression ${expression} =>`, parsedExpression);

    const fn = new Function(`return (${parsedExpression});`);
    return { status: Boolean(fn()), value: variableValue };
  } catch (error) {
    console.error("Condition evaluation failed:", error);
    return { status: false, value: variableValue };
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
    return undefined;
  }, obj);
}

export function resolveTemplate(value: any, context: any): any {
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
      return raw;
    }

    // Otherwise, replace templates inside the string and serialize objects/arrays
    return value.replace(templateRegex, (_, expr) => {
      const key = expr.trim();
      const val =
        key.startsWith("$.") || key.startsWith("$")
          ? resolvePath(context, key.replace(/^\$\./, "").replace(/^\$/, ""))
          : context[key];
      if (typeof val === "object") return JSON.stringify(val);
      return val ?? "";
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplate(item, context));
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        result[k] = resolveTemplate(value[k], context);
      }
    }
    return result;
  }

  return value;
}

/**
 * Execute a block of code in any supported language.
 */
export const executeCodeBlock = async (
  code: string,
  context: Record<string, any>,
  language: CodeBlockLanguage,
  timeoutMs = 5000,
  input = ""
): Promise<CodeExecutionResult> => {
  const startTime = Date.now();

  try {
    // Handle inline JS/TS execution with context
    if (
      ["javascript", "js", "typescript", "ts"].includes(language) &&
      Object.keys(context).length > 0
    ) {
      const func = new Function("context", code);
      const output = await Promise.race([
        Promise.resolve(func(context)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Execution timed out")), timeoutMs)
        ),
      ]);

      return {
        success: true,
        output: JSON.stringify(output, null, 2),
        exitCode: 0,
        executionTime: Date.now() - startTime,
      };
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
      return formatExecutionResult(false, `Unsupported language: ${language}`, startTime);
    }

    // Create a temporary folder and files
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-exec-"));
    const sourceFile = path.join(tempDir, `code${config.fileExtension}`);
    const compiledFile = path.join(tempDir, "output");

    await fs.writeFile(sourceFile, code, "utf-8");

    let execCommand = config.command;
    let execArgs: string[] = [];

    // Handle compilation (C, C++, Rust, Java, etc.)
    if (config.needsCompilation) {
      const compileResult = await runCodeProcess(
        config.compileCommand!,
        config.compileArgs!(sourceFile, compiledFile),
        "",
        timeoutMs
      );

      if (!compileResult.success) {
        return formatExecutionResult(
          false,
          `Compilation failed:\n${compileResult.error}`,
          startTime
        );
      }

      if (language === "java") {
        const runArgs = config.runArgs!(sourceFile);
        execCommand = runArgs[0];
        execArgs = runArgs.slice(1);
      } else {
        execCommand = compiledFile;
      }
    } else {
      execArgs = config.runArgs!(sourceFile);
    }

    // Execute the program
    const executionResult = await runCodeProcess(execCommand, execArgs, input, timeoutMs);

    return formatExecutionResult(
      executionResult.success,
      executionResult.output || executionResult.error,
      startTime,
      executionResult
    );
  } catch (error: any) {
    return formatExecutionResult(false, error.message, startTime);
  }
};

/**
 * Run a language command or compiled binary.
 */
const runCodeProcess = (
  command: string,
  args: string[],
  input: string,
  timeoutMs: number
): Promise<CodeExecutionResult> => {
  return new Promise((resolve) => {
    const processRef = spawn(command, args, { stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      processRef.kill("SIGKILL");
    }, timeoutMs);

    if (input && processRef.stdin) {
      processRef.stdin.write(input);
      processRef.stdin.end();
    }

    processRef.stdout?.on("data", (data) => (stdout += data.toString()));
    processRef.stderr?.on("data", (data) => (stderr += data.toString()));

    processRef.on("error", (err) => {
      clearTimeout(timeout);
      resolve(formatExecutionResult(false, `Execution failed: ${err.message}`));
    });

    processRef.on("close", (exitCode) => {
      clearTimeout(timeout);

      if (timedOut) {
        resolve(formatExecutionResult(false, "Execution timed out", undefined, { timedOut: true }));
      } else {
        const success = exitCode === 0;
        const output = success ? stdout.trim() : stderr.trim() || "Unknown error";
        resolve(formatExecutionResult(success, output, undefined, { exitCode }));
      }
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
): CodeExecutionResult => ({
  success,
  output: output.trim(),
  error: success ? undefined : output.trim(),
  exitCode: extra.exitCode ?? (success ? 0 : 1),
  timedOut: extra.timedOut ?? false,
  executionTime: startTime ? Date.now() - startTime : extra.executionTime ?? 0,
});
