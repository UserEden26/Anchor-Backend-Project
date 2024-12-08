export class InvalidLookUpSyntaxError extends Error {
  constructor() {
    super("invalid syntax for lookup in setCell");
    this.name = "InvalidLookUpSyntaxError";
  }
}
