import { CellNotSetError } from "../src/errors/CellNotSetError";
import { CellTypeError } from "../src/errors/CellTypeError";
import { CircularRefrenceError } from "../src/errors/CircularRefrenceError";
import { DuplicateColumnNamesError } from "../src/errors/DuplicateColumnNamesError";
import { SpreadSheetService } from "../src/SpreadSheet.service";
import { ColumnType, SpreadSheet } from "../src/types";

describe("SpreadSheetService.createNewSheet method", () => {
  let service: SpreadSheetService;

  beforeEach(() => {
    service = new SpreadSheetService();
  });

  it("should return the ID of the newly created sheet as a string", () => {
    const newSheet: SpreadSheet = {
      columns: [
        { name: "Column1", type: ColumnType.STR, values: new Map() },
        { name: "Column2", type: ColumnType.INT, values: new Map() },
      ],
    };

    const returnValue = service.createNewSheet(newSheet);

    expect(typeof returnValue).toBe("string");
  });

  it("should store the new sheet in the SHEETS object under the returned ID", () => {
    const newSheet: SpreadSheet = {
      columns: [
        { name: "Column1", type: ColumnType.STR, values: new Map() },
        { name: "Column2", type: ColumnType.INT, values: new Map() },
      ],
    };

    const sheetId = service.createNewSheet(newSheet);

    const storedSheet = service.SHEETS[sheetId];

    expect(storedSheet).toBeTruthy();
    expect(storedSheet).toEqual(newSheet);
  });

  it("should increase the number of sheets in the SHEETS object by 1 after running the createNewSheet", () => {
    const initialSheetCount = Object.keys(service.SHEETS).length;

    const newSheet: SpreadSheet = {
      columns: [
        { name: "Column1", type: ColumnType.STR, values: new Map() },
        { name: "Column2", type: ColumnType.BOOL, values: new Map() },
      ],
    };

    service.createNewSheet(newSheet);

    const finalSheetCount = Object.keys(service.SHEETS).length;

    expect(finalSheetCount).toBe(initialSheetCount + 1);
  });

  it(`should throw ${DuplicateColumnNamesError.name} when have 2 or more columns with the same name`, () => {
    const newSheet: SpreadSheet = {
      columns: [
        { name: "Column", type: ColumnType.STR, values: new Map() },
        { name: "Column", type: ColumnType.BOOL, values: new Map() },
      ],
    };

    expect(() => service.createNewSheet(newSheet)).toThrow(
      DuplicateColumnNamesError
    );
  });

  it("should throw an error for a complex circular reference across three columns when createing a sheet", () => {
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.BOOL,
          values: new Map<number, string>([
            [1, 'lookup("B", 1)'], // A(1) references B(1)
          ]),
        },
        {
          name: "B",
          type: ColumnType.BOOL,
          values: new Map<number, string>([
            [1, 'lookup("C", 1)'], // B(1) references C(1)
          ]),
        },
        {
          name: "C",
          type: ColumnType.BOOL,
          values: new Map<number, string>([
            [1, 'lookup("A", 1)'], // C(1) references A(1)
          ]),
        },
      ],
    };

    expect(() => service.createNewSheet(sheet)).toThrow(CircularRefrenceError);
  });

  it("should throw an error for a circular reference", () => {
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.STR,
          values: new Map<number, string>([
            [1, 'lookup("C", 1)'], // A(1) references C(1)
          ]),
        },
        {
          name: "C",
          type: ColumnType.STR,
          values: new Map<number, string>([[1, 'lookup("A", 1)']]),
        },
      ],
    };

    expect(() => service.createNewSheet(sheet)).toThrow(CircularRefrenceError);
  });

  it("should throw error for lookup to unset cell", () => {
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.STR,
          values: new Map<number, string>([
            [1, 'lookup("C", 1)'], // A(1) references C(1)
          ]),
        },
        {
          name: "C",
          type: ColumnType.STR,
          values: new Map<number, string>(),
        },
      ],
    };

    expect(() => service.createNewSheet(sheet)).toThrow(CellNotSetError);
  });

  it(`should throw ${CellNotSetError.name} when create a sheet with undefine value`, () => {
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.BOOL,
          values: new Map<number, any>([
            [1, undefined], // A(1) references C(1)
          ]),
        },
      ],
    };
    expect(() => service.createNewSheet(sheet)).toThrow(CellNotSetError);
  });

  it(`should throw ${CellTypeError.name} when create a sheet with wrong column type`, () => {
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.BOOL,
          values: new Map<number, any>([[1, 1]]),
        },
      ],
    };
    expect(() => service.createNewSheet(sheet)).toThrow(CellTypeError);
  });

  it("should throw CellNotSetError when points to unset or empty cell", () => {
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.STR,
          values: new Map([[1, 'lookup("B", 1)']]),
        },
        {
          name: "B",
          type: ColumnType.STR,
          values: new Map([[1, 'lookup("C", 1)']]),
        },
        {
          name: "C",
          type: ColumnType.STR,
          values: new Map(),
        },
      ],
    };

    expect(() => service.createNewSheet(sheet)).toThrow(CellNotSetError);
  });
});
