export class CellNotSetError extends Error {
  constructor(message?: string) {
    super(message ?? "Trying to touch unset value");
    this.name = "CellNotSetError";
  }
}
