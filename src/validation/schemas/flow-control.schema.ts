import Joi, { ObjectSchema } from "joi";
import { PATTERNS } from "../../constants";
import {
  ConditionalConfig,
  LogicalOperator,
  LoopConfig,
  LoopType,
  RuleExecutorConfig,
  SwitchConfig,
} from "../../types";

export const switchConfigurationSchema: {
  body: ObjectSchema<SwitchConfig>;
} = {
  body: Joi.object().keys({
    condition: Joi.string().pattern(PATTERNS.switch_case).required().messages({
      "string.pattern.base": "Configuration cases condition must be a valid switch case (e.g., case_1, case_2, ...).",
      "any.required": "Condition is required for switch case configuration.",
    }),
    expression: Joi.string().required(),
  }),
};

export const loopConfigurationSchema: { body: ObjectSchema<LoopConfig> } = {
  body: Joi.object().keys({
    loop_type: Joi.string()
      .valid(...Object.values(LoopType))
      .required(),
    max_iterations: Joi.when("loop_type", {
      is: LoopType.FIXED,
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.forbidden(),
    }),

    exit_condition: Joi.when("loop_type", {
      is: LoopType.WHILE,
      then: Joi.string().required(),
      otherwise: Joi.forbidden(),
    }),

    data_source_path: Joi.when("loop_type", {
      is: LoopType.FOR_EACH,
      then: Joi.string().required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

export const conditionSchema: { body: ObjectSchema<ConditionalConfig> } = {
  body: Joi.object().keys({
    expression: Joi.string().required(),
    operator: Joi.string()
      .valid(...Object.values(LogicalOperator))
      .optional(),
  }),
};

export const ruleExecutorSchema: { body: ObjectSchema<RuleExecutorConfig> } = {
  body: Joi.object().keys({
    ruleset_id: Joi.string().uuid().required(),
  }),
};
