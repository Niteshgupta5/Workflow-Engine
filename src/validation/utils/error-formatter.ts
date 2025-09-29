import { ValidationError } from "joi";

export function formatError(error: ValidationError) {
  return error.details.map((err) => ({
    field: err.context?.key,
    message: err.message,
  }));
}
