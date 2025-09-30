import Joi from "joi";
import { patterns } from "../constants";
import { NodeEdgesCondition } from "../../types";

export const nodeEdgeSchema = {
  body: Joi.object().keys({
    workflow_id: Joi.string().pattern(patterns.uuid).required(),
    source_node_id: Joi.string().pattern(patterns.uuid).required(),
    target_node_id: Joi.string().pattern(patterns.uuid).required(),
    condition: Joi.string()
      .valid(...Object.values(NodeEdgesCondition))
      .required(),
    group_id: Joi.string().pattern(patterns.uuid).optional(),
  }),
};
