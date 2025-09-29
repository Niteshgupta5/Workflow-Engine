import pkg from "lodash";
const { isEmpty, isNil, isObjectLike, isString } = pkg;

export function evaluateCondition(expression: string, context: Record<string, any>): boolean {
  try {
    const parsedExpression = expression.replace(/{{\s*\$\.([\w.]+)\s*}}/g, (_, key) => {
      const parts = key.split(".");
      let value: any = context;
      for (const part of parts) {
        value = value?.[part];
      }
      return JSON.stringify(value);
    });

    console.log(`Resolved Expression ${expression} =>`, parsedExpression);

    const fn = new Function(`return (${parsedExpression});`);
    return Boolean(fn());
  } catch (error) {
    console.error("Condition evaluation failed:", error);
    return false;
  }
}

export function resolveExpression(expression: string, context: Record<string, any>): any {
  try {
    const resolved = expression.replace(/{{\s*\$\.([\w.]+)\s*}}/g, (_, key) => {
      const parts = key.split(".");
      let value: any = context;
      for (const part of parts) {
        value = value?.[part];
      }
      return JSON.stringify(value);
    });

    console.log(`Resolved Expression ${expression} =>`, resolved);

    const fn = new Function(`return (${resolved});`);
    return fn();
  } catch (error) {
    console.error("Expression resolution failed:", error);
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
