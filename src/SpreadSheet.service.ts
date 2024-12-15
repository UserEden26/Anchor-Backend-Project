import { v4 as uuid4 } from "uuid";
import { Column, ColumnType, SpreadSheet } from "./types";
import { NotExsistSheetError } from "./errors/NotExsistSheetError";
import { InvalidCellIndexError } from "./errors/InvalidCellIndexError";
import { NotExsistColumnError } from "./errors/NotExsistColumnError";
import { CellNotSetError } from "./errors/CellNotSetError";
import { CellTypeError } from "./errors/CellTypeError";
import { isValueMatchingColumnType } from "./utils/isValueMatchingColumnType";
import { InvalidLookUpSyntaxError } from "./errors/InvalidLookUpSyntaxError";
import { DuplicateColumnNamesError } from "./errors/DuplicateColumnNamesError";
import { CircularRefrenceError } from "./errors/CircularRefrenceError";
import { InvalidSumSyntaxError } from "./errors/InvalidSumSyntaxError";

export class SpreadSheetService {
  SHEETS: Record<string, SpreadSheet> = {};
  lookupRegex = /lookup\("(.+)",\s*(\d+)\)/;
  sumRegex = /sum\("([^"]+)",\s*(\d+),\s*(\d+)\)$/;

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

    if (cellIndex < 0 || Number.isNaN(cellIndex)) {
      throw new InvalidCellIndexError();
    }

    const columnIndex = matchSheet.columns.findIndex(
      (column) => column.name === columnName
    );
    if (columnIndex == -1) {
      throw new NotExsistColumnError();
    }

    const column = matchSheet.columns[columnIndex];
    let resolvedValue = value;

    if (this.isSumFunction(value)) {
      const match = (value as string).match(this.sumRegex);
      if (!match) {
        throw new InvalidSumSyntaxError();
      }

      const [_, __, startSumIndexStr, endSumIndexStr] = match;
      const startSumIndex = parseInt(startSumIndexStr, 10);
      const endSumIndex = parseInt(endSumIndexStr, 10);

      resolvedValue = 0;
      for (let i = startSumIndex; i <= endSumIndex; i++) {
        resolvedValue += column.values.get(i);
      }
    }

    if (this.isLookupFunction(value)) {
      const match = (value as string).match(this.lookupRegex);
      if (!match) {
        throw new InvalidLookUpSyntaxError();
      }

      const [_, lookupColumnName, lookupRowIndexStr] = match;
      const lookupRowIndex = parseInt(lookupRowIndexStr, 10);

      resolvedValue = this.getCell(
        matchSheet,
        lookupColumnName,
        lookupRowIndex
      );

      // check if the pointer of the cell in the lookup is valid, if not throw
      this.detectCycle(matchSheet, columnName, cellIndex, false);

      if (resolvedValue === undefined) {
        throw new CellNotSetError(
          `Lookup target cell (${lookupColumnName}, ${lookupRowIndex}) does not exist`
        );
      }
    }

    if (!isValueMatchingColumnType(column.type, resolvedValue)) {
      throw new CellTypeError();
    }

    column.values.set(cellIndex, resolvedValue);
  }

  private isSumFunction(value: unknown) {
    return typeof value === "string" && value.startsWith("sum(");
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
          this.detectCycle(sheet, col.name, index, true);
        } else if (!isValueMatchingColumnType(col.type, value)) {
          throw new CellTypeError();
        }
      }
    });
  }

  getCell(sheet: SpreadSheet, columnName: string, cellIndex: number) {
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

    return column.values.get(cellIndex);
  }

  sum(column: Column) {
    if (column.type != ColumnType.DOUBLE || column.type != ColumnType.DOUBLE) {
      throw "error";
    }
  }

  private detectCycle(
    matchSheet: SpreadSheet,
    columnName: string,
    cellIndex: number,
    throwOnNotSetValueRefrence: boolean
  ) {
    const visitedColumnsCells = new Set<string>();
    const stack = [`${columnName}:${cellIndex}`];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (visitedColumnsCells.has(current)) {
        throw new CircularRefrenceError();
      }

      visitedColumnsCells.add(current);

      const [currentColName, currentRowIndex] = current.split(":");
      const col = matchSheet.columns.find((c) => c.name === currentColName);

      if (col) {
        const rowIndex = parseInt(currentRowIndex, 10);
        const refValue = col.values.get(rowIndex);

        if (this.isLookupFunction(refValue)) {
          const refMatch = refValue.match(this.lookupRegex);
          if (refMatch) {
            const [_, refColName, refRowIndexStr] = refMatch;
            const refRowIndex = parseInt(refRowIndexStr, 10);
            const refKey = `${refColName}:${refRowIndex}`;
            stack.push(refKey);
          }
        } else if (throwOnNotSetValueRefrence && refValue == undefined) {
          throw new CellNotSetError(
            `cell ${currentColName}:${rowIndex} is not set`
          );
        }
      }
    }
  }
}
