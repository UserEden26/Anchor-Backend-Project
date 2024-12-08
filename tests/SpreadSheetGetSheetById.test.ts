import { NotExsistSheetError } from "../src/errors/NotExsistSheetError";
import { SpreadSheetService } from "../src/SpreadSheet.service";
import { ColumnType, SpreadSheet } from "../src/types";

describe("SpreadSheetService.getSheetById method", () => {
  let service: SpreadSheetService;

  beforeEach(() => {
    service = new SpreadSheetService();
  });

  it(`should throw ${NotExsistSheetError.name} if a sheet with the given id does not exist`, () => {
    const invalidSheetId = "non-existent-id";

    expect(() => service.getSheetById(invalidSheetId)).toThrow(
      NotExsistSheetError
    );
  });

  it("should return the sheet if a sheet with the given id exists", () => {
    const columnName = "test";

    const mockSheet: SpreadSheet = {
      columns: [{ name: columnName, type: ColumnType.STR, values: new Map() }],
    };

    const generatedSheetId = service.createNewSheet(mockSheet);

    const returnValue = service.getSheetById(generatedSheetId);

    expect(returnValue).toBeTruthy();
    expect(returnValue.columns).toBeTruthy();
    expect(returnValue.columns[0].name).toBe(columnName);
  });
});
