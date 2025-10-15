// ============================================================================
// OBJECT TRANSFORMATION
// ============================================================================

import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { MapRule } from "../../../../types";
import { deleteNestedPath, getNestedValue, setNestedValue } from "./nested-value.helper";

export const mapObject = (obj: JsonValue, mapping: MapRule[]): JsonValue => {
  if (obj == null || typeof obj !== "object") {
    throw new Error("mapObject requires a valid object");
  }

  const result: JsonValue = {};

  for (const map of mapping) {
    const value = getNestedValue<JsonValue>(obj, map.source);

    if (map.target.includes(".")) {
      setNestedValue(result, map.target, value);
    } else {
      result[map.target] = value;
    }
  }

  return result;
};

export const renameKeys = (obj: JsonValue, mapping: Record<string, string>): JsonValue => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  return Object.entries(obj).reduce<JsonValue>((acc, [key, value]) => {
    if (acc == null) {
      return {};
    }
    const newKey = mapping[key] ?? key;
    (acc as JsonObject)[newKey] = value;
    return acc;
  }, {});
};

export const removeKeys = <T extends JsonValue>(obj: T, keys: string[]): T => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  // Clone shallowly (array or object)
  const result: JsonValue = Array.isArray(obj) ? [...obj] : { ...(obj as JsonObject) };

  for (const key of keys) {
    if (key.includes(".")) {
      deleteNestedPath(result as JsonObject, key);
    } else {
      if (!Array.isArray(result)) {
        delete (result as JsonObject)[key];
      }
    }
  }

  return result as T;
};
