// ============================================================================
// CONDITIONAL EVALUATION
// ============================================================================

import { ComparisonOperator } from "../../../../types";

export const evaluateCondition = (fieldValue: unknown, operator: ComparisonOperator, value: unknown): boolean => {
  switch (operator) {
    case ComparisonOperator.EQUALS:
      return fieldValue == value;

    case ComparisonOperator.STRICT_EQUALS:
      return fieldValue === value;

    case ComparisonOperator.NOT_EQUALS:
      return fieldValue != value;

    case ComparisonOperator.GREATER_THAN:
      return (fieldValue as number) > (value as number);

    case ComparisonOperator.LESS_THAN:
      return (fieldValue as number) < (value as number);

    case ComparisonOperator.GREATER_THAN_OR_EQUAL:
      return (fieldValue as number) >= (value as number);

    case ComparisonOperator.LESS_THAN_OR_EQUAL:
      return (fieldValue as number) <= (value as number);

    case ComparisonOperator.CONTAINS:
      if (fieldValue == null) return false;
      if (Array.isArray(fieldValue)) return fieldValue.includes(value);
      return String(fieldValue).includes(String(value));

    case ComparisonOperator.STARTS_WITH:
      return fieldValue != null && String(fieldValue).startsWith(String(value));

    case ComparisonOperator.ENDS_WITH:
      return fieldValue != null && String(fieldValue).endsWith(String(value));

    case ComparisonOperator.IN:
      return Array.isArray(value) && (value as unknown[]).includes(fieldValue);

    case ComparisonOperator.NOT_IN:
      return Array.isArray(value) && !(value as unknown[]).includes(fieldValue);

    case ComparisonOperator.EXISTS:
      return fieldValue !== null && fieldValue !== undefined;

    case ComparisonOperator.NOT_EXISTS:
      return fieldValue === null || fieldValue === undefined;

    default:
      return true;
  }
};
