import Joi, { ObjectSchema } from "joi";
import { PATTERNS } from "../../constants";
import { HttpMethod, SendEmail, SendHttpRequest, UpdateDatabase } from "../../types";

export const sendEmailSchema: { body: ObjectSchema<SendEmail> } = {
  body: Joi.object({
    from: Joi.string().email().required(),
    to: Joi.string().email().required(),
    subject: Joi.string().allow("").required(),
    message: Joi.string().required(),
  }),
};

export const sendHttpRequest: { body: ObjectSchema<SendHttpRequest> } = {
  body: Joi.object({
    url: Joi.string().pattern(PATTERNS.url).required(),
    method: Joi.string()
      .valid(...Object.values(HttpMethod))
      .required(),
    body: Joi.object().optional(),
  }),
};

export const updateDatabaseSchema: { body: ObjectSchema<UpdateDatabase> } = {
  body: Joi.object({
    table: Joi.string().required(),
    data: Joi.object().required(),
  }),
};
