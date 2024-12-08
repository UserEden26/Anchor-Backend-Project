import { NotExsistColumnError } from "../src/errors/NotExsistColumnError";
import { NotExsistSheetError } from "../src/errors/NotExsistSheetError";
import { InvalidCellIndexError } from "../src/errors/InvalidCellIndexError";
import { CellTypeError } from "../src/errors/CellTypeError";
import { isValueMatchingColumnType } from "../src/utils/isValueMatchingColumnType";
import { ColumnType } from "../src/types";
import { SpreadSheetService } from "../src/SpreadSheet.service";

jest.mock("../src/utils/isValueMatchingColumnType");

describe("SpreadSheetService.setCell function", () => {
  let service: SpreadSheetService;

  beforeEach(() => {
    service = new SpreadSheetService();
    service.SHEETS["mockSheet"] = {
      columns: [{ name: "A", type: ColumnType.INT, values: new Map() }],
    };
  });

  it("should set a cell value successfully", () => {
    (isValueMatchingColumnType as jest.Mock).mockReturnValue(true);

    service.setCell("mockSheet", "A", 0, 123);

    expect(service.SHEETS["mockSheet"].columns[0].values.get(0)).toBe(123);
  });

  it(`should throw ${NotExsistSheetError.name} if the sheet does not exist`, () => {
    expect(() => service.setCell("nonExistentSheet", "A", 0, 123)).toThrow(
      NotExsistSheetError
    );
  });

  it(`should throw ${InvalidCellIndexError.name} for negative index or NaN cell indexs`, () => {
    expect(() => service.setCell("mockSheet", "A", -1, 123)).toThrow(
      InvalidCellIndexError
    );

    expect(() => service.setCell("mockSheet", "A", NaN, 123)).toThrow(
      InvalidCellIndexError
    );
  });

  it(`should throw ${NotExsistColumnError.name} if the column does not exist`, () => {
    expect(() => service.setCell("mockSheet", "B", 0, 123)).toThrow(
      NotExsistColumnError
    );
  });

  it(`should throw ${CellTypeError.name} if the value does not match the column type`, () => {
    (isValueMatchingColumnType as jest.Mock).mockReturnValue(false);

    expect(() => service.setCell("mockSheet", "A", 0, "invalid")).toThrow(
      CellTypeError
    );
  });
});
