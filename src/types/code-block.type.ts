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
