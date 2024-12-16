import { CellNotSetError } from "../src/errors/CellNotSetError";
import { CircularRefrenceError } from "../src/errors/CircularRefrenceError";
import { NotExsistColumnError } from "../src/errors/NotExsistColumnError";
import { SpreadSheetService } from "../src/SpreadSheet.service";
import { ColumnType, SpreadSheet } from "../src/types";

describe("SpreadSheet.service getCellValue method", () => {
  let service: SpreadSheetService;
  let sheet: SpreadSheet;

  beforeEach(() => {
    service = new SpreadSheetService();
    sheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.STR,
          values: new Map<number, string>([
            [1, "123"],
            [10, "hello"],
          ]),
        },
        {
          name: "B",
          type: ColumnType.STR,
          values: new Map<number, any>([
            [1, 'lookup("A", 10)'],
            [2, 'lookup("B", 1)'],
          ]),
        },
      ],
    };
    service.createNewSheet(sheet);
  });

  it("should throw an error when trying to get cell that is not defined", () => {
    expect(() => service.getCellValue(sheet, "A", 2)).toThrow(CellNotSetError);
    expect(service.getCellValue(sheet, "A", 1)).toBe("123");
  });

  it("should get the value when trying to get value of a lookup cell", () => {
    expect(service.getCellValue(sheet, "B", 1)).toBe("hello");
    expect(service.getCellValue(sheet, "B", 2)).toBe("hello");
  });
});
