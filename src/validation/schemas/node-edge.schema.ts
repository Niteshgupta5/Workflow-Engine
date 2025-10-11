import Joi, { ObjectSchema } from "joi";
import { CreateNodeEdgeRecord, IdParameter, NodeEdgesCondition } from "../../types";
import { patterns } from "../../constants";

export const nodeEdgeSchema: { body: ObjectSchema<CreateNodeEdgeRecord> } = {
  body: Joi.object().keys({
    workflow_id: Joi.string().uuid().required(),
    source_node_id: Joi.string().uuid().required(),
    target_node_id: Joi.string().uuid().required(),
    condition: Joi.string()
      .custom((value, helpers) => {
        if (Object.values(NodeEdgesCondition).includes(value as NodeEdgesCondition)) return value;
        if (patterns.switch_case.test(value)) return value;
        return helpers.error("any.invalid");
      })
      .required()
      .messages({
        "any.invalid": `Edge condition must be one of (${Object.values(NodeEdgesCondition).join(
          ", "
        )}) or a valid switch case like (case_1, case_2, ...)`,
      }),
    group_id: Joi.string().uuid().optional(),
    expression: Joi.string().when("condition", {
      is: Joi.string().pattern(patterns.switch_case),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

export const deleteNodeEdgeSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};
