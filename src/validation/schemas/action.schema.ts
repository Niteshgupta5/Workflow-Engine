import Joi, { ObjectSchema } from "joi";
import { PATTERNS } from "../../constants";
import {
  HttpMethod,
  PepCheckInviteConfig,
  SendEmailConfig,
  SendHttpRequestConfig,
  UpdateDatabaseConfig,
  VipMembershipInviteConfig,
} from "../../types";

export const sendEmailSchema: { body: ObjectSchema<SendEmailConfig> } = {
  body: Joi.object({
    from: Joi.string().optional().default(process.env.SMTP_USER),
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

export const vipMembershipInviteSchema: { body: ObjectSchema<VipMembershipInviteConfig> } = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const pepCheckInviteSchema: { body: ObjectSchema<PepCheckInviteConfig> } = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};
