// ============================================================================
// TYPE CONVERSION
// ============================================================================

import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { ConversionType } from "../../../../types";
import { getNestedValue, setNestedValue } from "./nested-value.helper";

export const convertTypes = (obj: JsonValue, conversions: Record<string, ConversionType>): JsonValue => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }
  const result = { ...obj };

  for (const [field, targetType] of Object.entries(conversions)) {
    const value = getNestedValue(result, field);
    if (value == null) continue;

    const converted = convertValue(value, targetType);

    if (field.includes(".")) {
      setNestedValue(result, field, converted);
    } else {
      (result as JsonObject)[field] = converted as JsonValue;
    }
  }

  return result;
};

export const convertValue = (value: unknown, targetType: ConversionType) => {
  switch (targetType) {
    case ConversionType.STRING:
      return String(value);

    case ConversionType.NUMBER:
      return Number(value);

    case ConversionType.INTEGER:
      return Math.floor(Number(value));

    case ConversionType.BOOLEAN:
      if (typeof value === ConversionType.BOOLEAN) return value;
      if (typeof value === ConversionType.STRING) {
        return String(value).toLowerCase() === "true" || value === "1";
      }
      return Boolean(value);

    case ConversionType.DATE:
      return new Date(value as string | number | Date);

    case ConversionType.ARRAY:
      return Array.isArray(value) ? value : [value];

    case ConversionType.OBJECT:
      return typeof value === ConversionType.OBJECT && value !== null ? value : { value };

    default:
      return value;
  }
};
