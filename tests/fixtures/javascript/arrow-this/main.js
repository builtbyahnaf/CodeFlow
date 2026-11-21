export class Counter {
  #count = 0;

  increment() {
    const bump = () => {
      this.#count += 1;
    };
    return bump;
  }
}