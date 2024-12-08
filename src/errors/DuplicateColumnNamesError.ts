export class DuplicateColumnNamesError extends Error {
  constructor() {
    super("Can not have columns with the same name in the same sheet");
    this.name = "DuplicateColumnNames";
  }
}
