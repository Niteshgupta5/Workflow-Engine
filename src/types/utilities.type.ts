import { CodeBlockLanguage, NodeType } from "./enums";

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  exitCode: number | null;
  executionTime: number;
  error?: string;
  timedOut?: boolean;
}
export interface ExecutionLimits {
  timeoutMs?: number;
  memoryLimitKB?: number; // Memory limit in KB
  cpuTimeMs?: number;
}

export interface CodeBlockRule {
  language: CodeBlockLanguage;
  expression: string;
}

export interface UtilityMap {
  [NodeType.CODE_BLOCK]: CodeBlockRule;
}
