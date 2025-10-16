import Joi, { expression, ObjectSchema } from "joi";
import {
  AggregateNodeConfig,
  AggregationOperation,
  ConcatNodeConfig,
  ConversionType,
  ConvertTypeNodeConfig,
  DateFormatNodeConfig,
  DateOperation,
  DateOperationNodeConfig,
  FilterNodeConfig,
  FormulaNodeConfig,
  GroupNodeConfig,
  LogicalOperator,
  MapRule,
  MergeNodeConfig,
  MergeStrategy,
  RemoveNodeConfig,
  RenameNodeConfig,
  SplitNodeConfig,
  TimestampNodeConfig,
  TimestampOperation,
  TimeUnit,
} from "../../types";

export const mapRule: ObjectSchema<MapRule> = Joi.object({
  source: Joi.string().required(),
  target: Joi.string().required(),
  strategy: Joi.string()
    .valid(...Object.values(MergeStrategy))
    .optional(),
});

export const renameRule: ObjectSchema<RenameNodeConfig> = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
});

export const removeRule: ObjectSchema<RemoveNodeConfig> = Joi.object({
  fields: Joi.array().items(Joi.string()).min(1).required(),
});

export const filterRule: ObjectSchema<FilterNodeConfig> = Joi.object({
  condition: Joi.array()
    .items(
      Joi.object({
        expression: Joi.string().required(),
        operator: Joi.string()
          .valid(...Object.values(LogicalOperator))
          .required(),
      })
    )
    .required(),
  data: Joi.string().required(),
});

export const aggregateRule: ObjectSchema<AggregateNodeConfig> = Joi.object({
  groupBy: Joi.array().items(Joi.string()).required(),
  operations: Joi.array()
    .items(
      Joi.object({
        field: Joi.string().required(),
        type: Joi.string()
          .valid(...Object.values(AggregationOperation))
          .required(),
        target: Joi.string().required(),
      })
    )
    .required(),
});

export const groupRule: ObjectSchema<GroupNodeConfig> = Joi.object({
  groupBy: Joi.array().items(Joi.string()).min(1).required(),
});

export const concatRule: ObjectSchema<ConcatNodeConfig> = Joi.object({
  sources: Joi.array().items(Joi.string()).min(2).required(),
  target: Joi.string().required(),
  separator: Joi.string().optional(),
});

export const formulaRule: ObjectSchema<FormulaNodeConfig> = Joi.object({
  expression: Joi.string().required(),
});

export const convertTypeRule: ObjectSchema<ConvertTypeNodeConfig> = Joi.object({
  field: Joi.string().required(),
  toType: Joi.string()
    .valid(...Object.values(ConversionType))
    .required(),
});

export const mergeRule: ObjectSchema<MergeNodeConfig> = Joi.object({
  sources: Joi.array().items(Joi.string()).min(2).required(),
  target: Joi.string().required(),
});

export const splitRule: ObjectSchema<SplitNodeConfig> = Joi.object({
  field: Joi.string().required(),
  separator: Joi.string().required(),
  target: Joi.string().required(),
  limit: Joi.number().optional(),
  trim: Joi.boolean().optional(),
});

export const dateFormatRule: ObjectSchema<DateFormatNodeConfig> = Joi.object({
  field: Joi.string().required(),
  format: Joi.string().required(),
  target: Joi.string().optional(),
  timezone: Joi.string().optional(),
});

export const dateOperationRule: ObjectSchema<DateOperationNodeConfig> = Joi.object({
  field: Joi.string().required(),
  operation: Joi.string()
    .valid(...Object.values(DateOperation))
    .required(),
  value: Joi.number().required(),
  unit: Joi.string()
    .valid(...Object.values(TimeUnit))
    .required(),
  target: Joi.string().optional(),
});

export const timestampRule: ObjectSchema<TimestampNodeConfig> = Joi.object({
  field: Joi.string().required(),
  target: Joi.string().required(),
  unit: Joi.string()
    .valid(...Object.values(TimeUnit))
    .optional(),
  operation: Joi.string()
    .valid(...Object.values(TimestampOperation))
    .optional(),
});
