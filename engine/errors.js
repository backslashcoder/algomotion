/** Raised when raw user input fails an algorithm's validation. `errors` is a list of messages. */
export class InputValidationError extends Error {
  constructor(errors) {
    super(errors.join(" "));
    this.name = "InputValidationError";
    this.errors = errors;
  }
}

/** Raised when trace generation exceeds the step budget. */
export class TraceLimitError extends Error {
  constructor(limit) {
    super(
      `This input needs more than ${limit} visual steps. Try a smaller input.`,
    );
    this.name = "TraceLimitError";
    this.limit = limit;
  }
}

/** Raised when a generated trace does not satisfy the trace contract (a bug in an algorithm). */
export class TraceValidationError extends Error {
  constructor(problems) {
    super(`Invalid trace: ${problems.join("; ")}`);
    this.name = "TraceValidationError";
    this.problems = problems;
  }
}
