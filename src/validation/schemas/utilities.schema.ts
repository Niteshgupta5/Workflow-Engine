import Joi, { ObjectSchema } from "joi";
import { CodeBlockLanguage, CodeBlockRule } from "../../types";

export const codeBlockRule: ObjectSchema<CodeBlockRule> = Joi.object({
  expression: Joi.string().required(),
  language: Joi.string()
    .valid(...Object.values(CodeBlockLanguage))
    .required(),
});
