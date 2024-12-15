export class InvalidSumSyntaxError extends Error {
  constructor() {
    super("syntax of `sum` is invalid");
    this.name = "InvalidSumSyntaxError";
  }
}
