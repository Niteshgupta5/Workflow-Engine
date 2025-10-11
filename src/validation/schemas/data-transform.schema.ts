import Joi from "joi";
import { TransformationType } from "../../types";

const mapRule = Joi.object({
  source: Joi.string().required(),
  target: Joi.string().required(),
});

const renameRule = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
});

const removeRule = Joi.object({
  fields: Joi.array().items(Joi.string()).min(1).required(),
});

const filterRule = Joi.object({
  condition: Joi.string().required(),
});

const aggregateRule = Joi.object({
  groupBy: Joi.array().items(Joi.string()).required(),
  operations: Joi.array()
    .items(
      Joi.object({
        field: Joi.string().required(),
        type: Joi.string().valid("sum", "avg", "count", "min", "max").required(),
        target: Joi.string().required(),
      })
    )
    .required(),
});

const groupRule = Joi.object({
  groupBy: Joi.array().items(Joi.string()).min(1).required(),
});

const concatRule = Joi.object({
  sources: Joi.array().items(Joi.string()).min(2).required(),
  target: Joi.string().required(),
  separator: Joi.string().optional(),
});

const codeBlockRule = Joi.object({
  expression: Joi.string().required(),
  language: Joi.string().valid("js", "py").required(),
});

const convertTypeRule = Joi.object({
  field: Joi.string().required(),
  toType: Joi.string().valid("string", "number", "boolean", "date").required(),
});

const mergeRule = Joi.object({
  sources: Joi.array().items(Joi.string()).min(2).required(),
  target: Joi.string().required(),
});

const splitRule = Joi.object({
  field: Joi.string().required(),
  separator: Joi.string().required(),
  target: Joi.string().required(),
});

const dateFormatRule = Joi.object({
  field: Joi.string().required(),
  format: Joi.string().required(),
  target: Joi.string().optional(),
});

const dateOperationRule = Joi.object({
  field: Joi.string().required(),
  operation: Joi.string().valid("add", "subtract").required(),
  value: Joi.number().required(),
  unit: Joi.string().valid("days", "months", "years", "hours", "minutes").required(),
  target: Joi.string().optional(),
});

const timestampRule = Joi.object({
  field: Joi.string().optional(),
  target: Joi.string().required(),
});

export const dataTransformRuleSchema = Joi.alternatives().conditional("...transformation_type", [
  {
    is: TransformationType.MAP,
    then: Joi.array().items(mapRule).min(1).required(),
  },
  {
    is: Joi.valid(TransformationType.RENAME, TransformationType.COPY),
    then: renameRule.required(),
  },
  {
    is: TransformationType.REMOVE,
    then: removeRule.required(),
  },
  {
    is: TransformationType.FILTER,
    then: filterRule.required(),
  },
  {
    is: TransformationType.AGGREGATE,
    then: aggregateRule.required(),
  },
  {
    is: TransformationType.GROUP,
    then: groupRule.required(),
  },
  {
    is: Joi.valid(TransformationType.CONCAT, TransformationType.FORMULA),
    then: concatRule.required(),
  },
  {
    is: TransformationType.CODE_BLOCK,
    then: codeBlockRule.required(),
  },
  {
    is: TransformationType.CONVERT_TYPE,
    then: convertTypeRule.required(),
  },
  {
    is: TransformationType.MERGE,
    then: mergeRule.required(),
  },
  {
    is: TransformationType.SPLIT,
    then: splitRule.required(),
  },
  {
    is: TransformationType.DATE_FORMAT,
    then: dateFormatRule.required(),
  },
  {
    is: TransformationType.DATE_OPERATION,
    then: dateOperationRule.required(),
  },
  {
    is: TransformationType.TIMESTAMP,
    then: timestampRule.required(),
  },
]);
