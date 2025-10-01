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

export function getJson<T>(value: any): T {
  return value as T;
}

export const isNilOrEmpty = (value: any): boolean =>
  isNil(value) || ((isObjectLike(value) || isString(value)) && isEmpty(value));

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getValueByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}
