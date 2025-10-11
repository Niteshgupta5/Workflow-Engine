export class ExecutionTimeoutError extends Error {
  constructor(message = "Execution timed out") {
    super(message);
    this.name = "ExecutionTimeoutError";
  }
}
