export class NotExsistColumnError extends Error {
  constructor() {
    super("column was not found");
    this.name = "NotExsistColumnError";
  }
}
