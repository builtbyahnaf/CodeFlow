export class Temperature {
  #celsius = 0;

  get celsius() {
    return this.#celsius;
  }

  set celsius(next) {
    this.#celsius = next;
  }

  bump() {
    this.celsius = this.celsius + 1;
    return this.celsius;
  }
}