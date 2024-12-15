import { SpreadSheetService } from "../src/SpreadSheet.service";
import { ColumnType, SpreadSheet } from "../src/types";

describe("SpreadSheet sum method", () => {
  let service: SpreadSheetService;

  beforeEach(() => {
    service = new SpreadSheetService();
    const sheet: SpreadSheet = {
      columns: [
        {
          name: "A",
          type: ColumnType.INT,
          values: new Map<number, number>([
            [10, 1],
            [11, 1],
            [12, 2],
            [13, 2],
          ]),
        },
      ],
    };
    service.createNewSheet(sheet);
  });
  it("should work", () => {
    const id = Object.keys(service.SHEETS)[0];
    service.setCell(id, "A", 14, 'sum("A",10,13)');
    const sumValue = service.getCell(service.getSheetById(id), "A", 14);
    expect(sumValue).toBe(6);
  });
});
