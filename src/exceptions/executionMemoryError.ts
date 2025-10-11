export class ExecutionMemoryError extends Error {
  constructor(message = "Memory limit exceeded") {
    super(message);
    this.name = "ExecutionMemoryError";
  }
}
