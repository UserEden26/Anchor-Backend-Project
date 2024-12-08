export class InvalidCellIndexError extends Error {
  constructor() {
    super("cell index need to be positive number");
    this.name = "InvalidCellIndexError";
  }
}
