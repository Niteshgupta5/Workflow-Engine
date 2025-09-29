import { Request, Response, NextFunction } from "express";
import Joi, { ObjectSchema } from "joi";
import { formatError } from "../utils";
import pkg from "lodash";

const { pick } = pkg;
const slashRemove = { errors: { wrap: { label: "" } } };

export const validateRequest =
  <T>(schema: Record<string, ObjectSchema<T>>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
      .allow("")
      .prefs({ errors: { label: "key" } })
      .validate(object, slashRemove);
    if (error) {
      res.status(400).json({ errors: formatError(error) });
      return;
    }
    Object.assign(req, value);
    return next();
  };
