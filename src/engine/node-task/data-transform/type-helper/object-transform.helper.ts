// ============================================================================
// OBJECT TRANSFORMATION
// ============================================================================

import { DataObject, MapRule } from "../../../../types";
import { deleteNestedPath, getNestedValue, setNestedValue } from "./nested-value.helper";

export const mapObject = (obj: DataObject, mapping: MapRule[]): DataObject => {
  if (obj == null || typeof obj !== "object") {
    throw new Error("mapObject requires a valid object");
  }

  const result: DataObject = {};

  for (const map of mapping) {
    const value = getNestedValue(obj, map.source);

    if (map.target.includes(".")) {
      setNestedValue(result, map.target, value);
    } else {
      result[map.target] = value;
    }
  }

  return result;
};

export const renameKeys = (obj: DataObject, mapping: Record<string, string>): DataObject => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  return Object.entries(obj).reduce<DataObject>((acc, [key, value]) => {
    const newKey = mapping[key] ?? key;
    acc[newKey] = value;
    return acc;
  }, {});
};

export const removeKeys = (obj: DataObject, keys: string[]): DataObject => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  const result = { ...obj };

  for (const key of keys) {
    if (key.includes(".")) {
      deleteNestedPath(result, key);
    } else {
      delete result[key];
    }
  }

  return result;
};
