import _ from "lodash";
import { PATTERNS } from "../constants";

/** Utility: Resolve and evaluate functions within expressions */
export function resolveFunctions(expression: string): any {
  try {
    if (typeof expression !== "string") return expression;

    let result = expression;
    let hasNested;

    do {
      hasNested = false;
      result = result.replace(PATTERNS.fnPattern, (match, fnName, rawArgs) => {
        if (!fnMap[fnName]) return match;
        hasNested = true;

        try {
          const args = parseArgs(rawArgs);
          const fnResult = fnMap[fnName](...args);

          // stringify arrays or objects for re-parsing if nested
          if (Array.isArray(fnResult) || typeof fnResult === "object") {
            return JSON.stringify(fnResult);
          }

          return fnResult;
        } catch (err) {
          console.error(`Error executing function ${fnName}:`, err);
          return match;
        }
      });
    } while (hasNested); // keep looping until no inner functions left

    return result;
  } catch (error) {
    console.error("Function evaluation failed:", expression, error);
    return expression;
  }
}

/** Utility: Flatten nested arrays */
function flatten(arr: any): any[] {
  return Array.isArray(arr) ? arr.flat(Infinity) : arr;
}

function toNumberSafe(value: any): number {
  if (value == null || value === "" || isNaN(Number(value))) return 0;
  return Number(value);
}

function parseArgs(str: any): any[] {
  const args = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if ((ch === "'" || ch === '"') && str[i - 1] !== "\\") {
      if (inString && ch === quoteChar) {
        inString = false;
      } else if (!inString) {
        inString = true;
        quoteChar = ch;
      }
    }

    if (!inString) {
      if (ch === "[" || ch === "{") depth++;
      if (ch === "]" || ch === "}") depth--;

      if (ch === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) args.push(current.trim());

  return args.map((arg) => {
    try {
      // Try to safely evaluate numbers, arrays, and objects
      return Function(`"use strict"; return (${arg});`)();
    } catch {
      // Fallback to raw string if not valid JS
      return arg.replace(/^['"]|['"]$/g, "");
    }
  });
}

// All supported helper functions
const fnMap: Record<string, any> = {
  // String Functions
  lower: (val: string) => (typeof val === "string" ? val.toLowerCase() : val),
  upper: (val: string) => (typeof val === "string" ? val.toUpperCase() : val),
  capitalize: (val: string) => _.capitalize(String(val)),
  startcase: (val: string) => _.startCase(String(val)),
  concat: (vals: string[], separator: string = "") => vals.join(separator),
  trim: (val: string) => (typeof val === "string" ? val.trim() : val),
  substr: (val: string, start: number, end?: number) => val.substring(start, end),
  replace: (str: any, search: string, replace: string) => String(str).replace(new RegExp(search, "g"), replace),
  length: (val: any) => (Array.isArray(val) || typeof val === "string" ? val.length : 0),

  // Math Functions
  abs: (val: number) => Math.abs(toNumberSafe(val)),
  round: (val: number, decimals = 0) => Math.round(toNumberSafe(val) * Math.pow(10, decimals)) / Math.pow(10, decimals),
  min: (...vals: number[]) => Math.min(...flatten(vals)),
  max: (...vals: number[]) => Math.max(...flatten(vals)),
  sum: (...arr: number[]) => arr.map(toNumberSafe).reduce((a, b) => a + b, 0),
  avg: (...arr: number[]) => {
    const arrFlat = flatten(arr);
    return arrFlat.map(toNumberSafe).reduce((a, b) => a + b, 0) / arrFlat.length;
  },
  ceil: (val: number) => Math.ceil(toNumberSafe(val)),
  floor: (val: number) => Math.floor(toNumberSafe(val)),
  trunc: (val: number) => Math.trunc(toNumberSafe(val)),
  median: (...args: number[]) => {
    const nums = args.map(toNumberSafe).sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
  },
  random: (min = 0, max = 1) => {
    const a = Number(min),
      b = Number(max);
    return Math.random() * (b - a) + a;
  },
  sqrt: (n: any) => Math.sqrt(toNumberSafe(n)),
  pow: (base: any, exp: any) => Math.pow(toNumberSafe(base), toNumberSafe(exp)),
  mod: (a: any, b: any) => toNumberSafe(a) % toNumberSafe(b),

  // Date Functions
  now: () => new Date().toISOString(),
  date: (val: string | number) => new Date(val),
  timestamp: () => Date.now(),

  // Logical Functions
  cond: (cond: any, a: any, b: any) => (cond ? a : b),
  coalesce: (...args: any[]) => args.find((a) => a != null && a !== ""),
  toNumber: (v: any) => Number(v),
  toString: (v: any) => String(v),
  toBoolean: (v: any) => v === "true" || v === true,

  // Object Functions.
  size: (obj: any) => (Array.isArray(obj) ? obj.length : Object.keys(obj).length),
  keys: (obj: any) => Object.keys(obj),
  values: (obj: any) => Object.values(obj),

  // JSON Functions
  jsonParse: (str: string) => JSON.parse(str),
  jsonStringify: (obj: any) => JSON.stringify(obj),
};
