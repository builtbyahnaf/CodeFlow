export class Vault {
  #secret = 1;
  static #shared = 2;

  read() {
    return this.#secret;
  }

  write(next) {
    this.#secret = next;
  }
}