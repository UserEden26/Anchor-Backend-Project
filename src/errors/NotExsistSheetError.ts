export class NotExsistSheetError extends Error {
  constructor() {
    super("sheetId does not match any sheet");
    this.name = "NotExsistSheetError";
  }
}
