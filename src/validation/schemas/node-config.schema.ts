import Joi, { AlternativesSchema } from "joi";
import { NodeConfiguration, NodeType } from "../../types";
import { sendEmailSchema, sendHttpRequest, updateDatabaseSchema } from "./action.schema";
import { conditionSchema, loopConfigurationSchema, switchConfigurationSchema } from "./flow-control.schema";
import {
  aggregateRule,
  concatRule,
  convertTypeRule,
  dateFormatRule,
  dateOperationRule,
  filterRule,
  formulaRule,
  groupRule,
  mapRule,
  mergeRule,
  removeRule,
  renameRule,
  splitRule,
  timestampRule,
} from "./data-transform.schema";
import { codeBlockRule } from "./utilities.schema";

export const nodeConfigurationSchema: AlternativesSchema<NodeConfiguration> = Joi.alternatives().conditional("type", [
  {
    is: NodeType.SEND_EMAIL,
    then: sendEmailSchema.body.required(),
  },
  {
    is: NodeType.SEND_HTTP_REQUEST,
    then: sendHttpRequest.body.required(),
  },
  {
    is: NodeType.UPDATE_DATABASE,
    then: updateDatabaseSchema.body.required(),
  },
  {
    is: NodeType.LOOP,
    then: loopConfigurationSchema.body.required(),
  },
  {
    is: NodeType.SWITCH,
    then: Joi.object({
      switch_cases: Joi.array().items(switchConfigurationSchema.body).min(1).required(),
    }),
  },
  {
    is: NodeType.CONDITIONAL,
    then: Joi.object({
      conditions: Joi.array().items(conditionSchema.body).min(1).required(),
    }),
  },
  {
    is: NodeType.MAP,
    then: Joi.object({
      map: Joi.array().items(mapRule).min(1).required(),
    }),
  },
  {
    is: Joi.valid(NodeType.RENAME, NodeType.COPY),
    then: renameRule.required(),
  },
  {
    is: NodeType.REMOVE,
    then: removeRule.required(),
  },
  {
    is: NodeType.FILTER,
    then: filterRule.required(),
  },
  {
    is: NodeType.AGGREGATE,
    then: aggregateRule.required(),
  },
  {
    is: NodeType.GROUP,
    then: groupRule.required(),
  },
  {
    is: NodeType.CONCAT,
    then: concatRule.required(),
  },
  {
    is: NodeType.FORMULA,
    then: formulaRule.required(),
  },
  {
    is: NodeType.CONVERT_TYPE,
    then: convertTypeRule.required(),
  },
  {
    is: NodeType.MERGE,
    then: mergeRule.required(),
  },
  {
    is: NodeType.SPLIT,
    then: splitRule.required(),
  },
  {
    is: NodeType.DATE_FORMAT,
    then: dateFormatRule.required(),
  },
  {
    is: NodeType.DATE_OPERATION,
    then: dateOperationRule.required(),
  },
  {
    is: NodeType.TIMESTAMP,
    then: timestampRule.required(),
  },
  {
    is: NodeType.CODE_BLOCK,
    then: codeBlockRule.required(),
  },
]);
