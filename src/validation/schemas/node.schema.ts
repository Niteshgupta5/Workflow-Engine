import Joi, { ObjectSchema } from "joi";
import { CreateNodeRecord, IdParameter, NodeEdgesCondition, NodeType, UpdateNodeRecord } from "../../types";
import { PATTERNS, START_NODE_ID } from "../../constants";
import { nodeConfigurationSchema } from "./node-config.schema";

export const nodeSchema: { body: ObjectSchema<CreateNodeRecord> } = {
  body: Joi.object().keys({
    workflow_id: Joi.string().uuid().required(),
    type: Joi.string()
      .valid(...Object.values(NodeType))
      .required(),
    name: Joi.string().min(3).max(255).required(),
    configuration: nodeConfigurationSchema.required(),
    prev_node_id: Joi.string().uuid().optional().default(START_NODE_ID),
    next_node_id: Joi.string().uuid().optional(),
    condition: Joi.string()
      .custom((value, helpers) => {
        if (Object.values(NodeEdgesCondition).includes(value as NodeEdgesCondition)) return value;
        if (PATTERNS.switch_case.test(value)) return value;
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
    retry_attempts: Joi.number().integer().allow(null).optional(),
    retry_delay_ms: Joi.number().integer().allow(null).optional(),
  }),
};

export const updateNodeSchema: { body: ObjectSchema<UpdateNodeRecord> } = {
  body: Joi.object().keys({
    type: Joi.string()
      .valid(...Object.values(NodeType))
      .required(),
    name: Joi.string().min(3).max(255).required(),
    configuration: nodeConfigurationSchema.required(),
    retry_attempts: Joi.number().integer().allow(null).optional(),
    retry_delay_ms: Joi.number().integer().allow(null).optional(),
  }),
};

export const deleteNodeSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};
