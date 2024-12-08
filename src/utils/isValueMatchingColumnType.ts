import { ColumnType } from "../types";

export function isValueMatchingColumnType(
  type: ColumnType,
  value: unknown
): boolean {
  switch (type) {
    case ColumnType.BOOL:
      return typeof value === "boolean";

    case ColumnType.STR:
      return typeof value === "string";

    case ColumnType.INT:
      return (
        typeof value === "number" &&
        (Number.isInteger(value) || Number.isNaN(value))
      );

    case ColumnType.DOUBLE:
      return (
        typeof value === "number" &&
        (!Number.isInteger(value) || Number.isNaN(value))
      );

    default:
      return false;
  }
}
