import { ObjectSchema } from "joi";

export const validate = <T>(schema: ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw error;
  }
  return value as T;
};
