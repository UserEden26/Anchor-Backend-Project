export class CellTypeError extends Error {
  constructor() {
    super("column type not matching cell type");
    this.name = "CellTypeError";
  }
}
