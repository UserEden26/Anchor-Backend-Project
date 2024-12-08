import { ColumnType } from "../../src/types";
import { isValueMatchingColumnType } from "../../src/utils/isValueMatchingColumnType";

describe("isValueMatchingColumnType function", () => {
  it("should return true for valid BOOL type", () => {
    expect(isValueMatchingColumnType(ColumnType.BOOL, true)).toBe(true);
    expect(isValueMatchingColumnType(ColumnType.BOOL, false)).toBe(true);
  });

  it("should return false for invalid BOOL type", () => {
    expect(isValueMatchingColumnType(ColumnType.BOOL, "true")).toBe(false);
    expect(isValueMatchingColumnType(ColumnType.BOOL, 1)).toBe(false);
  });

  it("should return true for valid STR type", () => {
    expect(isValueMatchingColumnType(ColumnType.STR, "Hello")).toBe(true);
    expect(isValueMatchingColumnType(ColumnType.STR, "")).toBe(true);
  });

  it("should return false for invalid STR type", () => {
    expect(isValueMatchingColumnType(ColumnType.STR, 42)).toBe(false);
    expect(isValueMatchingColumnType(ColumnType.STR, true)).toBe(false);
  });

  it("should return true for valid INT type", () => {
    expect(isValueMatchingColumnType(ColumnType.INT, 42)).toBe(true);
    expect(isValueMatchingColumnType(ColumnType.INT, 0)).toBe(true);
  });

  it("should return false for invalid INT type", () => {
    expect(isValueMatchingColumnType(ColumnType.INT, 3.14)).toBe(false);
    expect(isValueMatchingColumnType(ColumnType.INT, "42")).toBe(false);
  });

  it("should return true for valid DOUBLE type", () => {
    expect(isValueMatchingColumnType(ColumnType.DOUBLE, 3.14)).toBe(true);
    expect(isValueMatchingColumnType(ColumnType.DOUBLE, -0.1)).toBe(true);
  });

  it("should return false for invalid DOUBLE type", () => {
    expect(isValueMatchingColumnType(ColumnType.DOUBLE, 42)).toBe(false);
    expect(isValueMatchingColumnType(ColumnType.DOUBLE, "3.14")).toBe(false);
  });

  it("should return false for unknown types", () => {
    expect(isValueMatchingColumnType(ColumnType.BOOL, {})).toBe(false);
    expect(isValueMatchingColumnType(ColumnType.STR, undefined)).toBe(false);
  });

  it("NaN should be a valid DOUBLE type and INT type", () => {
    expect(isValueMatchingColumnType(ColumnType.DOUBLE, NaN)).toBe(true);
    expect(isValueMatchingColumnType(ColumnType.INT, NaN)).toBe(true);
  });
});
