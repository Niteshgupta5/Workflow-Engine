// ============================================================================
// NESTED PATH UTILITIES
// ============================================================================

import { DataObject } from "../../../../types";

export const getNestedValue = <T = unknown>(obj: unknown, path: string): T | undefined => {
  if (!path || obj == null) return obj as T | undefined;

  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj) as T | undefined;
};

export const setNestedValue = (obj: DataObject, path: string, value: unknown): void => {
  if (!path || obj == null) return;

  const parts = path.split(".");
  const last = parts.pop();

  if (!last) return;

  const target = parts.reduce<DataObject>((acc, part) => {
    if (acc[part] == null || typeof acc[part] !== "object") {
      acc[part] = {};
    }
    return acc[part] as DataObject;
  }, obj);

  target[last] = value;
};

export const hasNestedPath = (obj: unknown, path: string): boolean => {
  if (!path || obj == null || typeof obj !== "object") return false;

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return false;
    }

    const currentObj = current as Record<string, unknown>;
    if (!(part in currentObj)) {
      return false;
    }
    current = currentObj[part];
  }

  return true;
};

export const deleteNestedPath = (obj: DataObject, path: string): boolean => {
  if (!path || obj == null) return false;

  const parts = path.split(".");
  const last = parts.pop();

  if (!last) return false;

  if (parts.length === 0) {
    return delete obj[last];
  }

  const parent = getNestedValue<DataObject>(obj, parts.join("."));

  if (parent && typeof parent === "object") {
    return delete parent[last];
  }

  return false;
};
