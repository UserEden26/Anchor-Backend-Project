import { InvalidCellIndexError } from "../src/errors/InvalidCellIndexError";
import { NotExsistColumnError } from "../src/errors/NotExsistColumnError";
import { SpreadSheetService } from "../src/SpreadSheet.service";
import { ColumnType, SpreadSheet } from "../src/types";

describe("SpreadSheet.getCell private method", () => {
  let service: SpreadSheetService;

  beforeEach(() => {
    service = new SpreadSheetService();
  });

  const sheet: SpreadSheet = {
    columns: [
      {
        name: "A",
        type: ColumnType.STR,
        values: new Map<number, any>([[1, "hello"]]),
      },
    ],
  };

  it("should throw an error for NaN and negitive cell indexs and not exsist columns", () => {
    expect(() => service.getCell(sheet, "A", NaN)).toThrow(
      InvalidCellIndexError
    );
    expect(() => service.getCell(sheet, "A", -1)).toThrow(
      InvalidCellIndexError
    );

    expect(() => service.getCell(sheet, "B", 6)).toThrow(NotExsistColumnError);
  });
});
