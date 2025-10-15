// ============================================================================
// ARRAY OPERATIONS (using lodash)
// ============================================================================

import { JsonObject } from "@prisma/client/runtime/library";
import { AggregationOperation } from "../../../../types";
import { getNestedValue } from "./nested-value.helper";
import _ from "lodash";

export const aggregate = <T extends JsonObject>(
  data: T[],
  operation: AggregationOperation | string,
  field?: string
): unknown => {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const values = field ? data.map((item) => getNestedValue(item, field)).filter((v) => v != null) : data;

  switch (operation) {
    case AggregationOperation.SUM:
      return _.sumBy(values, (v) => Number(v));

    case AggregationOperation.AVG:
    case AggregationOperation.AVERAGE:
      return _.meanBy(values, (v) => Number(v));

    case AggregationOperation.COUNT:
      return values.length;

    case AggregationOperation.MIN:
      return _.minBy(values, (v) => Number(v));

    case AggregationOperation.MAX:
      return _.maxBy(values, (v) => Number(v));

    case AggregationOperation.FIRST:
      return _.first(values);

    case AggregationOperation.LAST:
      return _.last(values);

    case AggregationOperation.UNIQUE:
      return _.uniq(values);

    case AggregationOperation.JOIN:
      return values.map((v) => String(v)).join(", ");

    default:
      return values;
  }
};
