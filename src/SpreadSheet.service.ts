import { v4 as uuid4 } from "uuid";
import { SpreadSheet } from "./types";
import { NotExsistSheetError } from "./errors/NotExsistSheetError";
import { InvalidCellIndexError } from "./errors/InvalidCellIndexError";
import { NotExsistColumnError } from "./errors/NotExsistColumnError";
import { CellNotSetError } from "./errors/CellNotSetError";
import { CellTypeError } from "./errors/CellTypeError";
import { isValueMatchingColumnType } from "./utils/isValueMatchingColumnType";
import { InvalidLookUpSyntaxError } from "./errors/InvalidLookUpSyntaxError";
import { DuplicateColumnNamesError } from "./errors/DuplicateColumnNamesError";
import { CircularRefrenceError } from "./errors/CircularRefrenceError";

export class SpreadSheetService {
  SHEETS: Record<string, SpreadSheet> = {};
  lookupRegex = /lookup\("(.+)",\s*(\d+)\)/;

  createNewSheet(newSheet: SpreadSheet) {
    const id = uuid4();
    this.validateSheet(newSheet);
    this.SHEETS[id] = newSheet;
    return id;
  }

  getSheetById(sheetId: string) {
    const matchSheet = this.SHEETS[sheetId];
    if (matchSheet == undefined) {
      throw new NotExsistSheetError();
    }
    return matchSheet;
  }

  setCell(
    sheetId: string,
    columnName: string,
    cellIndex: number,
    value: unknown
  ) {
    const matchSheet = this.getSheetById(sheetId);

    const column = this.validateCellReturnColumn(
      matchSheet,
      columnName,
      cellIndex
    );

    let resolvedValue = value;
    if (this.isLookupFunction(value)) {
      const match = (value as string).match(this.lookupRegex);
      if (!match) {
        throw new InvalidLookUpSyntaxError();
      }

      resolvedValue = this.detectCycleReturnRefValue(
        matchSheet,
        columnName,
        cellIndex,
        value
      );
    }

    if (!isValueMatchingColumnType(column.type, resolvedValue)) {
      throw new CellTypeError();
    }

    column.values.set(cellIndex, resolvedValue);
  }

  private isLookupFunction(value: unknown) {
    return typeof value === "string" && value.startsWith("lookup(");
  }

  private validateSheet(sheet: SpreadSheet) {
    const hasDuplicates =
      new Set(sheet.columns.map((obj) => obj.name)).size !==
      sheet.columns.length;

    if (hasDuplicates) {
      throw new DuplicateColumnNamesError();
    }

    sheet.columns.forEach((col) => {
      const values = col.values.entries();
      for (const [index, value] of values) {
        if (value == undefined) {
          throw new CellNotSetError(`${col.name}:${index} does not set`);
        }

        if (this.isLookupFunction(value)) {
          // on create of the sheet check if any of the lookup pointer point to unset value
          this.detectCycleReturnRefValue(sheet, col.name, index, true);
        } else if (!isValueMatchingColumnType(col.type, value)) {
          throw new CellTypeError();
        }
      }
    });
  }

  private validateCellReturnColumn(
    sheet: SpreadSheet,
    columnName: string,
    cellIndex: number
  ) {
    if (cellIndex < 0 || Number.isNaN(cellIndex)) {
      throw new InvalidCellIndexError();
    }

    const columnIndex = sheet.columns.findIndex(
      (column) => column.name === columnName
    );

    if (columnIndex == -1) {
      throw new NotExsistColumnError();
    }

    return sheet.columns[columnIndex];
  }

  private detectCycleReturnRefValue(
    matchSheet: SpreadSheet,
    columnName: string,
    cellIndex: number,
    firstValue?: any
  ) {
    const visitedColumnsCells = new Set<string>();
    const startCell = `${columnName}:${cellIndex}`;
    const stack = [startCell];
    let refValue = undefined;

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (visitedColumnsCells.has(current)) {
        throw new CircularRefrenceError();
      }

      visitedColumnsCells.add(current);

      const [currentColName, currentRowIndex] = current.split(":");
      const rowIndex = parseInt(currentRowIndex, 10);
      const col = this.validateCellReturnColumn(
        matchSheet,
        currentColName,
        rowIndex
      );

      if (col) {
        refValue = col.values.get(rowIndex);
        if (
          firstValue !== undefined &&
          `${currentColName}:${currentRowIndex}` === startCell
        ) {
          refValue = firstValue;
        }

        if (this.isLookupFunction(refValue)) {
          const refMatch = refValue.match(this.lookupRegex);
          if (refMatch) {
            const [_, refColName, refRowIndexStr] = refMatch;
            const refRowIndex = parseInt(refRowIndexStr, 10);
            const refKey = `${refColName}:${refRowIndex}`;
            stack.push(refKey);
          }
        } else if (refValue == undefined) {
          throw new CellNotSetError(
            `cell ${currentColName}:${rowIndex} is not set`
          );
        }
      }
    }
    return refValue;
  }
}

// A1 -> B1 -> C1 = (123)
// c1 = lookup(A1)
// A1 -> B1 -> C1 -> A1
// B1 -> C1 -> A1 -> 123

// יעשה את ה SET לפני
// lookup()
