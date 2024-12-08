import { CellNotSetError } from "../../src/errors/CellNotSetError";

describe("CellNotSetError", () => {
  it("should throw default error if error not provedied, should throw the message if provide message", () => {
    const messageCheck = "test";

    expect(() => {
      throw new CellNotSetError();
    }).toThrow("Trying to touch unset value");

    expect(() => {
      throw new CellNotSetError(messageCheck);
    }).toThrow(messageCheck);
  });
});
