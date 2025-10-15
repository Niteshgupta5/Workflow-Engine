import { ExecutionStatus } from "./enums";

export interface JsonConfig {
  [key: string]: any;
}

export interface IdParameter {
  id: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  nextNodeId: string | null;
  error?: Error;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  message: string;
  from?: string;
}
