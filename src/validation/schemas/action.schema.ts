import Joi, { ObjectSchema } from "joi";
import { PATTERNS } from "../../constants";
import { HttpMethod, SendEmailConfig, SendHttpRequestConfig, UpdateDatabaseConfig } from "../../types";

export const sendEmailSchema: { body: ObjectSchema<SendEmailConfig> } = {
  body: Joi.object({
    from: Joi.string().required(),
    to: Joi.array().items(Joi.string()).min(1).required(),
    subject: Joi.string().allow("").required(),
    message: Joi.string().required(),
  }),
};

export const sendHttpRequest: { body: ObjectSchema<SendHttpRequestConfig> } = {
  body: Joi.object({
    url: Joi.string().pattern(PATTERNS.url).required(),
    method: Joi.string()
      .valid(...Object.values(HttpMethod))
      .required(),
    body: Joi.object().optional(),
    headers: Joi.object().optional(),
  }),
};

export const updateDatabaseSchema: { body: ObjectSchema<UpdateDatabaseConfig> } = {
  body: Joi.object({
    table: Joi.string().required(),
    data: Joi.object().required(),
  }),
};
