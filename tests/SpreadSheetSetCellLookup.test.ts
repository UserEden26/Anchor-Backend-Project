import { CellNotSetError } from "../src/errors/CellNotSetError";
import { CellTypeError } from "../src/errors/CellTypeError";
import { InvalidLookUpSyntaxError } from "../src/errors/InvalidLookUpSyntaxError";
import { NotExsistColumnError } from "../src/errors/NotExsistColumnError";
import { SpreadSheetService } from "../src/SpreadSheet.service";
import { ColumnType, SpreadSheet } from "../src/types";

describe("SpreadSheetService - setCell with lookup", () => {
  let service: SpreadSheetService;

  beforeEach(() => {
    service = new SpreadSheetService();
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.STR,
          values: new Map<number, string>([
            [1, "123"],
            [10, "hello"],
          ]),
        },
        { name: "B", type: ColumnType.BOOL, values: new Map() },
        { name: "C", type: ColumnType.STR, values: new Map() },
      ],
    };
    service.createNewSheet(sheet);
  });

  it("should resolve a lookup value and set it in the target cell", () => {
    const sheetId = Object.keys(service.SHEETS)[0];

    service.setCell(sheetId, "A", 10, "hello");
    service.setCell(sheetId, "C", 1, 'lookup("A",10)');

    const sheet = service.getSheetById(sheetId);

    expect(sheet.columns.find((col) => col.name === "C")!.values.get(1)).toBe(
      "hello"
    );
  });

  it("should throw an error for a type mismatch in the lookup", () => {
    const sheetId = Object.keys(service.SHEETS)[0];

    service.setCell(sheetId, "A", 10, "hello");

    expect(() => service.setCell(sheetId, "B", 1, 'lookup("A",10)')).toThrow(
      CellTypeError
    );
  });

  it(`should throw ${InvalidLookUpSyntaxError.name} if the lookup sytax is wrong`, () => {
    const sheetId = Object.keys(service.SHEETS)[0];

    expect(() => service.setCell(sheetId, "C", 1, 'lookup("A","10")')).toThrow(
      InvalidLookUpSyntaxError
    );
    expect(() => service.setCell(sheetId, "C", 1, 'lookup("A )')).toThrow(
      InvalidLookUpSyntaxError
    );
  });

  it(`should throw ${NotExsistColumnError.name} if the target of the lookup does not exsis`, () => {
    const sheetId = Object.keys(service.SHEETS)[0];
    expect(() => service.setCell(sheetId, "A", 1, 'lookup("M", 1)')).toThrow(
      NotExsistColumnError
    );
  });

  it(`should throw an ${CellNotSetError.name} error if trying to lookup for a unset cell`, () => {
    const sheetId = Object.keys(service.SHEETS)[0];
    expect(() => service.setCell(sheetId, "A", 1, 'lookup("C", 5)')).toThrow(
      CellNotSetError
    );
  });
});
