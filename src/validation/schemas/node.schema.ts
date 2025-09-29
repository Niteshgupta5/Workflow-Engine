import Joi, { ObjectSchema } from "joi";
import { patterns } from "../constants";
import { ActionName, CreateNodeRecord, HttpMethod, NodeEdgesCondition, NodeType } from "../../types";

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

      url: Joi.string().pattern(patterns.url).when(Joi.ref("...action_name"), {
        is: ActionName.SEND_HTTP_REQUEST,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),

      method: Joi.string()
        .valid(...Object.values(HttpMethod))
        .when(Joi.ref("...action_name"), {
          is: ActionName.SEND_HTTP_REQUEST,
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),

      body: Joi.object().optional(),
    }).required(),

    retry_attempts: Joi.number().integer().min(0).optional(),
    retry_delay_ms: Joi.number().integer().min(0).optional(),
  }),
};

const conditionSchema = {
  body: Joi.object().keys({
    expression: Joi.string().required(),
  }),
};

export const nodeSchema: { body: ObjectSchema<CreateNodeRecord> } = {
  body: Joi.object().keys({
    workflow_id: Joi.string().pattern(patterns.uuid).required(),
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

    parent_node_id: Joi.string().pattern(patterns.uuid).optional(),
    condition: Joi.string()
      .valid(...Object.values(NodeEdgesCondition))
      .when("parent_node_id", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
  }),
};
