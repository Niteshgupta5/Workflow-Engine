import { ExecutionStatus } from "./enums";

export interface JsonConfig {
  [key: string]: any;
}

export interface IdParameter {
  id: string;
}

export interface ExecutionResult extends JsonConfig {
  status: ExecutionStatus;
  nextNodeId: string | null;
  error?: Error;
}

export type DataObject = Record<string, unknown>;

export interface EmailOptions {
  to: string[];
  subject: string;
  message: string;
  from: string;
}
