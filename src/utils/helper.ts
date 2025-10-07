import pkg from "lodash";
const { isEmpty, isNil, isObjectLike, isString } = pkg;

export function evaluateCondition(expression: string, context: Record<string, any>): { status: boolean; value: any } {
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
