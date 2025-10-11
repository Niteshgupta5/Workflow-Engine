// ============================================================================
// DATE OPERATIONS (using date-fns)
// ============================================================================

import { add, format, isValid, parseISO, sub } from "date-fns";
import { DataObject, DateOperation, FormatType, TimestampOperation, TimeUnit } from "../../../../types";
import { getNestedValue, setNestedValue } from "./nested-value.helper";

export const performDateOperation = (
  obj: DataObject,
  field: string | undefined,
  operation: DateOperation | string,
  value: number,
  unit: TimeUnit | string,
  target?: string
): DataObject | string => {
  const dateValue = field ? getNestedValue(obj, field) : obj;
  let date: Date;

  if (typeof dateValue === "string") {
    date = parseISO(dateValue);
  } else {
    date = new Date(dateValue as string | number | Date);
  }

  if (!isValid(date)) {
    return obj;
  }

  const duration: any = { [unit]: value };
  const newDate = operation === DateOperation.ADD || operation === "add" ? add(date, duration) : sub(date, duration);

  const resultValue = newDate.toISOString();

  if (!field && !target) {
    return resultValue;
  }

  const result = { ...obj };
  const targetField = target || field;

  if (targetField) {
    if (targetField.includes(".")) {
      setNestedValue(result, targetField, resultValue);
    } else {
      result[targetField] = resultValue;
    }
  }

  return result;
};

export const formatDateField = (
  obj: DataObject,
  field: string | undefined,
  formatStr: FormatType | string,
  target?: string,
  timezone?: string
): DataObject | string => {
  const value = field ? getNestedValue(obj, field) : obj;
  let date: Date;

  if (typeof value === "string") {
    date = parseISO(value);
  } else {
    date = new Date(value as string | number | Date);
  }

  if (!isValid(date)) {
    return obj;
  }

  let formatted: string;

  switch (formatStr.toUpperCase()) {
    case FormatType.ISO:
      formatted = date.toISOString();
      break;

    case FormatType.DATE:
      formatted = format(date, "yyyy-MM-dd");
      break;

    case FormatType.TIME:
      formatted = format(date, "HH:mm:ss");
      break;

    case FormatType.DATETIME:
      formatted = format(date, "yyyy-MM-dd HH:mm:ss");
      break;

    case FormatType.TIMESTAMP:
      formatted = String(date.getTime());
      break;

    default:
      // Custom format string
      formatted = format(date, formatStr);
  }

  if (!field && !target) {
    return formatted;
  }

  const result = { ...obj };
  const targetField = target || field;

  if (targetField) {
    if (targetField.includes(".")) {
      setNestedValue(result, targetField, formatted);
    } else {
      result[targetField] = formatted;
    }
  }

  return result;
};

export const handleTimestamp = (
  obj: DataObject,
  field: string | undefined,
  operation: TimestampOperation,
  unit: TimeUnit,
  target?: string
): DataObject | number | string => {
  const value = field ? getNestedValue(obj, field) : obj;

  let result: number | string;

  if (operation === TimestampOperation.TO_TIMESTAMP) {
    const date = new Date(value as string | number | Date);
    result = unit === TimeUnit.SECONDS ? Math.floor(date.getTime() / 1000) : date.getTime();
  } else {
    const timestamp = Number(value);
    const ms = unit === TimeUnit.SECONDS ? timestamp * 1000 : timestamp;
    result = new Date(ms).toISOString();
  }

  if (!field && !target) {
    return result;
  }

  const output = { ...obj };
  const targetField = target || field;

  if (targetField) {
    if (targetField.includes(".")) {
      setNestedValue(output, targetField, result);
    } else {
      output[targetField] = result;
    }
  }

  return output;
};
