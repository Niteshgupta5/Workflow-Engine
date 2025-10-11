// ============================================================================
// DEEP MERGE (using lodash)
// ============================================================================

import _ from "lodash";
import { DataObject } from "../../../../types";

export const deepMerge = (...objects: DataObject[]): DataObject => {
  return _.merge({}, ...objects);
};

export const deepClone = <T>(obj: T): T => {
  return _.cloneDeep(obj);
};
