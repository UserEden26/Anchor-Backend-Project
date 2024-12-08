export class CircularRefrenceError extends Error {
  constructor() {
    super("Circular refrence");
    this.name = "CircularRefrenceError";
  }
}
