import Joi, { ObjectSchema } from "joi";
import { CreateWorkflowRecord, IdParameter } from "../../types";

export const createWorkflowSchema: { body: ObjectSchema<CreateWorkflowRecord> } = {
  body: Joi.object().keys({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(255).optional(),
  }),
};

export const deleteWorkflowSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};
