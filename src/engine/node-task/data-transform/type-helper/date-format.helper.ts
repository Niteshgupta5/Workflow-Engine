// ============================================================================
// DATE OPERATIONS (using date-fns)
// ============================================================================

import { add, Duration, format, isDate, sub } from "date-fns";
import { DataObject, DateFormat, DateOperation, FormatType, TimestampOperation, TimeUnit } from "../../../../types";
import { getNestedValue, setNestedValue } from "./nested-value.helper";
import { parseDateValue } from "../../../../utils";

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
    date = parseDateValue(dateValue);
  } else {
    date = new Date(dateValue as string | number | Date);
  }

  let newDate: Date;

  // ✅ Handle milliseconds manually (since date-fns doesn't)
  if (unit === TimeUnit.MILLISECONDS) {
    const diff = operation === DateOperation.ADD ? value : -value;
    newDate = new Date(date.getTime() + diff);
  } else {
    const duration: Duration = { [unit]: value };
    newDate = operation === DateOperation.ADD ? add(date, duration) : sub(date, duration);
  }

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
    date = parseDateValue(value);
  } else {
    date = new Date(value as string | number | Date);
  }
  // Convert date to the specified timezone if provided
  if (timezone) {
    throw Error("Timezone not supported");
  }
  let formatted: string;

  switch (formatStr.toUpperCase()) {
    case FormatType.ISO:
      formatted = date.toISOString();
      break;

    case FormatType.DATE:
      formatted = format(date, DateFormat.YYYY_MM_DD);
      break;

    case FormatType.TIME:
      formatted = format(date, DateFormat.HH_MM_SS);
      break;

    case FormatType.DATETIME:
      formatted = format(date, DateFormat.YYYY_MM_DD_HH_MM_SS);
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
    const timestamp = isDate(value) ? value.getTime() : Number(value);

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
