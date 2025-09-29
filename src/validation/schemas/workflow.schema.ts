import Joi from "joi";

export const createWorkflowSchema = {
  body: Joi.object().keys({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(255).optional(),
  }),
};
