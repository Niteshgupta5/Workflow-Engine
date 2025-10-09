export interface CodeExecutionResult {
  success: boolean;
  output: string;
  exitCode: number | null;
  executionTime: number;
  error?: string;
  timedOut?: boolean;
}
