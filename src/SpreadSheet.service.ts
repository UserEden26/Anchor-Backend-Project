import { v4 as uuid4 } from "uuid";
import { Column, SpreadSheet } from "./types";
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
  lookupMap: Map<string, string> = new Map<string, string>();

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
      const [_, refColName, refCellIndexStr] = this.validateMethod(
        this.lookupRegex,
        value as string,
        InvalidLookUpSyntaxError
      );

      const copyMap = new Map(this.lookupMap);
      copyMap.set(
        `${columnName}:${cellIndex}`,
        `${refColName}:${refCellIndexStr}`
      );

      this.validateCellReturnColumn(matchSheet, columnName, cellIndex);

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

  private validateMethod(
    reg: RegExp,
    value: string,
    ErrorClass: new () => Error
  ) {
    const match = value.match(reg);
    if (!match) {
      throw new ErrorClass();
    }
    return match;
  }

  private isLookupFunction(value: unknown) {
    return typeof value === "string" && value.startsWith("lookup(");
  }

  private hasDuplicatessColumnNames(columns: Column[]) {
    const hasDuplicates =
      new Set(columns.map((obj) => obj.name)).size !== columns.length;

    if (hasDuplicates) {
      throw new DuplicateColumnNamesError();
    }
  }

  private validateSheet(sheet: SpreadSheet) {
    this.hasDuplicatessColumnNames(sheet.columns);

    sheet.columns.forEach((col) => {
      const values = col.values.entries();
      for (const [index, value] of values) {
        if (value === undefined || value === null) {
          throw new CellNotSetError(`${col.name}:${index} does not set`);
        }

        if (this.isLookupFunction(value)) {
          const [_, refColName, refCellIndex] = this.validateMethod(
            this.lookupRegex,
            value,
            InvalidLookUpSyntaxError
          );

          this.lookupMap.set(
            `${col.name}:${index}`,
            `${refColName}:${refCellIndex}`
          );

          this.detectCycleReturnRefValue(sheet, col.name, index);
        } else if (!isValueMatchingColumnType(col.type, value)) {
          throw new CellTypeError();
        }
      }
    });
  }

  getCellValue(sheet: SpreadSheet, columnName: string, cellIndex: number) {
    const col = this.validateCellReturnColumn(sheet, columnName, cellIndex);

    let cellValue = col.values.get(cellIndex);
    if (this.isLookupFunction(cellValue)) {
      const [_, refColName, refCellIndex] = this.validateMethod(
        this.lookupRegex,
        cellValue,
        InvalidLookUpSyntaxError
      );
      const refRowIndex = parseInt(refCellIndex, 10);

      cellValue = this.getValueFromLookup(sheet, refColName, refRowIndex);
    }

    if (cellValue === undefined || cellValue === null) {
      throw new CellNotSetError(
        `${col.name}:${cellIndex} or its refrence does not set`
      );
    }

    return cellValue;
  }

  private getValueFromLookup(
    sheet: SpreadSheet,
    refColName: string,
    refCellIndex: number
  ): any {
    const cell = `${refColName}:${refCellIndex}`;
    if (this.lookupMap.has(cell)) {
      const pointerInMap = this.lookupMap.get(cell)!;
      const [currentColName, currentRowIndex] = pointerInMap.split(":");
      const rowIndex = parseInt(currentRowIndex, 10);
      return this.getValueFromLookup(sheet, currentColName, rowIndex);
    } else {
      return this.getCellValue(sheet, refColName, refCellIndex);
    }
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

    const column = sheet.columns[columnIndex];

    return column;
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
