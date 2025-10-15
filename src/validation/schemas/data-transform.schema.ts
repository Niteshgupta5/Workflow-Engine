import Joi, { ObjectSchema } from "joi";
import {
  AggregateRule,
  AggregationOperation,
  CodeBlockLanguage,
  CodeBlockRule,
  ConcatRule,
  ConversionType,
  ConvertTypeRule,
  DateFormatRule,
  DateOperation,
  DateOperationRule,
  FilterRule,
  FormulaRule,
  GroupRule,
  MapRule,
  MergeRule,
  MergeStrategy,
  RemoveRule,
  RenameRule,
  SplitRule,
  TimestampOperation,
  TimestampRule,
  TimeUnit,
} from "../../types";

export const mapRule: ObjectSchema<MapRule> = Joi.object({
  source: Joi.string().required(),
  target: Joi.string().required(),
  strategy: Joi.string()
    .valid(...Object.values(MergeStrategy))
    .optional(),
});

export const renameRule: ObjectSchema<RenameRule> = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
});

export const removeRule: ObjectSchema<RemoveRule> = Joi.object({
  fields: Joi.array().items(Joi.string()).min(1).required(),
});

export const filterRule: ObjectSchema<FilterRule> = Joi.object({
  condition: Joi.string().required(),
});

export const aggregateRule: ObjectSchema<AggregateRule> = Joi.object({
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

export const groupRule: ObjectSchema<GroupRule> = Joi.object({
  groupBy: Joi.array().items(Joi.string()).min(1).required(),
});

export const concatRule: ObjectSchema<ConcatRule> = Joi.object({
  sources: Joi.array().items(Joi.string()).min(2).required(),
  target: Joi.string().required(),
  separator: Joi.string().optional(),
});

export const formulaRule: ObjectSchema<FormulaRule> = Joi.object({
  expression: Joi.string().required(),
});

export const convertTypeRule: ObjectSchema<ConvertTypeRule> = Joi.object({
  field: Joi.string().required(),
  toType: Joi.string()
    .valid(...Object.values(ConversionType))
    .required(),
});

export const mergeRule: ObjectSchema<MergeRule> = Joi.object({
  sources: Joi.array().items(Joi.string()).min(2).required(),
  target: Joi.string().required(),
});

export const splitRule: ObjectSchema<SplitRule> = Joi.object({
  field: Joi.string().required(),
  separator: Joi.string().required(),
  target: Joi.string().required(),
  limit: Joi.number().optional(),
  trim: Joi.boolean().optional(),
});

export const dateFormatRule: ObjectSchema<DateFormatRule> = Joi.object({
  field: Joi.string().required(),
  format: Joi.string().required(),
  target: Joi.string().optional(),
  timezone: Joi.string().optional(),
});

export const dateOperationRule: ObjectSchema<DateOperationRule> = Joi.object({
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

export const timestampRule: ObjectSchema<TimestampRule> = Joi.object({
  field: Joi.string().required(),
  target: Joi.string().required(),
  unit: Joi.string()
    .valid(...Object.values(TimeUnit))
    .optional(),
  operation: Joi.string()
    .valid(...Object.values(TimestampOperation))
    .optional(),
});
