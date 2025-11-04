import Joi, { AlternativesSchema, ObjectSchema } from "joi";
import {
  AuthConfig,
  AuthType,
  CreateTriggerRecord,
  EventName,
  HttpMethod,
  IdParameter,
  TriggerConfiguration,
  TriggerType,
  UpdateTriggerRecord,
} from "../../types";
import { PATTERNS } from "../../constants";

export const authSchema: ObjectSchema<AuthConfig> = Joi.object({
  type: Joi.string()
    .valid(...Object.values(AuthType))
    .required(),
  username: Joi.when("type", {
    is: AuthType.BASIC,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  password: Joi.when("type", {
    is: AuthType.BASIC,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  header_key: Joi.when("type", {
    is: AuthType.HEADER,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  header_value: Joi.when("type", {
    is: AuthType.HEADER,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
}).default({ type: AuthType.NONE });

export const configurationSchema: AlternativesSchema<TriggerConfiguration> = Joi.alternatives().conditional("type", [
  {
    is: TriggerType.WEBHOOK,
    then: Joi.object({
      webhook: Joi.object({
        endpoint: Joi.string().pattern(PATTERNS.url).required(),
        method: Joi.string()
          .valid(...Object.values(HttpMethod))
          .required(),
        authentication: authSchema,
        mockData: Joi.any().optional(),
      }).optional(),
    }),
  },
  {
    is: TriggerType.SCHEDULE,
    then: Joi.object({
      schedule: Joi.object({
        cron_expression: Joi.string().pattern(PATTERNS.cron).required(),
        timezone: Joi.string().optional(),
        method: Joi.string()
          .valid(...Object.values(HttpMethod))
          .required(),
        endpoint: Joi.string().pattern(PATTERNS.url).required(),
        authentication: authSchema,
        mockData: Joi.any().optional(),
      }).optional(),
    }),
  },
  {
    is: TriggerType.EVENT,
    then: Joi.object({
      event: Joi.object({
        event_name: Joi.string()
          .valid(...Object.values(EventName))
          .required(),
        method: Joi.string()
          .valid(...Object.values(HttpMethod))
          .optional(),
        endpoint: Joi.string().pattern(PATTERNS.url).optional(),
        // authentication: authSchema,
        mockData: Joi.any().optional(),
      }).required(),
    }),
  },
  {
    is: TriggerType.HTTP_REQUEST,
    then: Joi.object({
      http_request: Joi.object({
        endpoint: Joi.string().pattern(PATTERNS.url).required(),
        method: Joi.string()
          .valid(...Object.values(HttpMethod))
          .required(),
        authentication: authSchema,
        mockData: Joi.any().optional(),
      }).optional(),
    }),
  },
]);

export const createTriggerSchema: { body: ObjectSchema<CreateTriggerRecord> } = {
  body: Joi.object().keys({
    workflow_id: Joi.string().uuid().required(),
    name: Joi.string().allow(""),
    type: Joi.string()
      .valid(...Object.values(TriggerType))
      .required(),
    configuration: configurationSchema.required(),
  }),
};

export const updateTriggerSchema: {
  body: ObjectSchema<UpdateTriggerRecord>;
} = {
  body: Joi.object().keys({
    name: Joi.string().max(255).optional(),
    type: Joi.string()
      .valid(...Object.values(TriggerType))
      .required(),
    configuration: configurationSchema.optional(),
  }),
};

export const getTriggerSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};

export const deleteTriggerSchema: { params: ObjectSchema<IdParameter> } = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};
