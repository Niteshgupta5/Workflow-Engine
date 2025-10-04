import Joi, { ObjectSchema } from "joi";
import { CreateNodeEdgeRecord, IdParameter, NodeEdgesCondition } from "../../types";

export const nodeEdgeSchema: { body: ObjectSchema<CreateNodeEdgeRecord> } = {
  body: Joi.object().keys({
    workflow_id: Joi.string().uuid().required(),
    source_node_id: Joi.string().uuid().required(),
    target_node_id: Joi.string().uuid().required(),
    condition: Joi.string()
      .valid(...Object.values(NodeEdgesCondition))
      .required(),
    group_id: Joi.string().uuid().optional(),
  }),
};

export const deleteNodeEdgeSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};
