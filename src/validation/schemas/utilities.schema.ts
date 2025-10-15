import Joi, { ObjectSchema } from "joi";
import { CodeBlockLanguage, CodeBlockNodeConfig } from "../../types";

export const codeBlockRule: ObjectSchema<CodeBlockNodeConfig> = Joi.object({
  expression: Joi.string().required(),
  language: Joi.string()
    .valid(...Object.values(CodeBlockLanguage))
    .required(),
});
