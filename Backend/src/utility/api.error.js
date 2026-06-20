class ApiError extends Error {
  constructor(
    statuscode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statuscode = statuscode;
    this.data = null;
    this.message = message;
    this.errors = errors;
    this.stack = stack;
    this.success = false;
  }
}

export { ApiError };
