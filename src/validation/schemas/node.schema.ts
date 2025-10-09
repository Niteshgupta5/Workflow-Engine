import Joi, { AlternativesSchema, ObjectSchema } from "joi";
import {
  ActionName,
  CreateNodeRecord,
  HttpMethod,
  IdParameter,
  LoopType,
  NodeConfiguration,
  NodeEdgesCondition,
  NodeType,
  SwitchCaseConfiguration,
  UpdateNodeRecord,
} from "../../types";
import { patterns, START_NODE_ID } from "../../utils";

const actionSchema = {
  body: Joi.object().keys({
    action_name: Joi.string()
      .valid(...Object.values(ActionName))
      .required(),

    params: Joi.object({
      table: Joi.string().when(Joi.ref("...action_name"), {
        is: ActionName.UPDATE_DATABASE,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),

      data: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),

      url: Joi.string()
        .pattern(patterns.url)
        .when(Joi.ref("...action_name"), {
          is: Joi.valid(ActionName.SEND_HTTP_REQUEST, ActionName.SEND_EMAIL),
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),

      method: Joi.string()
        .valid(...Object.values(HttpMethod))
        .when(Joi.ref("...action_name"), {
          is: Joi.valid(ActionName.SEND_HTTP_REQUEST, ActionName.SEND_EMAIL),
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),

      body: Joi.object().optional(),
    }).required(),

    retry_attempts: Joi.number().integer().min(0).max(3).optional(),
    retry_delay_ms: Joi.number().integer().min(0).optional(),
  }),
};

const conditionSchema = {
  body: Joi.object().keys({
    expression: Joi.string().required(),
  }),
};

const loopConfigurationSchema = {
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

const switchConfigurationSchema: { body: ObjectSchema<SwitchCaseConfiguration> } = {
  body: Joi.object().keys({
    condition: Joi.string().pattern(patterns.switch_case).required().messages({
      "string.pattern.base": "Configuration cases condition must be a valid switch case (e.g., case_1, case_2, ...).",
      "any.required": "Condition is required for switch case configuration.",
    }),
    expression: Joi.string().required(),
  }),
};

export const nodeConfigurationSchema: AlternativesSchema<NodeConfiguration> = Joi.alternatives().conditional("type", [
  {
    is: NodeType.LOOP,
    then: Joi.object({
      loop_configuration: loopConfigurationSchema.body.required(),
    }),
  },
  {
    is: NodeType.SWITCH,
    then: Joi.object({
      switch_cases: Joi.array().items(switchConfigurationSchema.body).min(1).required(),
    }),
  },
]);

export const nodeSchema: { body: ObjectSchema<CreateNodeRecord> } = {
  body: Joi.object().keys({
    workflow_id: Joi.string().uuid().required(),
    type: Joi.string()
      .valid(...Object.values(NodeType))
      .required(),
    name: Joi.string().min(3).max(255).required(),

    actions: Joi.array().items(actionSchema.body).when("type", {
      is: NodeType.ACTION,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),

    conditions: Joi.array().items(conditionSchema.body).when("type", {
      is: NodeType.CONDITIONAL,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),

    configuration: Joi.when("type", {
      is: Joi.valid(NodeType.LOOP, NodeType.SWITCH),
      then: nodeConfigurationSchema.required(),
      otherwise: Joi.forbidden(),
    }),
    prev_node_id: Joi.string().uuid().optional().default(START_NODE_ID),
    next_node_id: Joi.string().uuid().optional(),
    condition: Joi.string()
      .custom((value, helpers) => {
        if (Object.values(NodeEdgesCondition).includes(value as NodeEdgesCondition)) return value;
        if (patterns.switch_case.test(value)) return value;
        return helpers.error("any.invalid");
      })
      .when("prev_node_id", {
        is: Joi.exist(),
        then: Joi.required().messages({
          "any.invalid": `Edge condition must be one of (${Object.values(NodeEdgesCondition).join(
            ", "
          )}) or a valid switch case like (case_1, case_2, ...)`,
        }),
        otherwise: Joi.forbidden(),
      }),
    group_id: Joi.string().uuid().optional(),
  }),
};

const updateActionSchema = {
  body: Joi.object().keys({
    id: Joi.string().uuid().optional(),
    action_name: Joi.string()
      .valid(...Object.values(ActionName))
      .required(),

    params: Joi.object({
      table: Joi.string().when(Joi.ref("...action_name"), {
        is: ActionName.UPDATE_DATABASE,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),

      data: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),

      url: Joi.string()
        .pattern(patterns.url)
        .when(Joi.ref("...action_name"), {
          is: Joi.valid(ActionName.SEND_HTTP_REQUEST, ActionName.SEND_EMAIL),
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),

      method: Joi.string()
        .valid(...Object.values(HttpMethod))
        .when(Joi.ref("...action_name"), {
          is: Joi.valid(ActionName.SEND_HTTP_REQUEST, ActionName.SEND_EMAIL),
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),

      body: Joi.object().optional(),
    }).required(),

    retry_attempts: Joi.number().integer().min(0).max(3).optional(),
    retry_delay_ms: Joi.number().integer().min(0).optional(),
  }),
};

const updateConditionSchema = {
  body: Joi.object().keys({
    id: Joi.string().uuid().optional(),
    expression: Joi.string().required(),
  }),
};

export const updateNodeSchema: { body: ObjectSchema<UpdateNodeRecord> } = {
  body: Joi.object().keys({
    type: Joi.string()
      .valid(...Object.values(NodeType))
      .required(),
    name: Joi.string().min(3).max(255).required(),

    actions: Joi.array()
      .items(updateActionSchema.body)
      .when("type", {
        is: NodeType.ACTION,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      })
      .optional(),

    conditions: Joi.array()
      .items(updateConditionSchema.body)
      .when("type", {
        is: NodeType.CONDITIONAL,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      })
      .optional(),

    configuration: Joi.when("type", {
      is: Joi.valid(NodeType.LOOP, NodeType.SWITCH),
      then: nodeConfigurationSchema.required(),
      otherwise: Joi.forbidden(),
    }).optional(),
  }),
};

export const deleteNodeSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};
