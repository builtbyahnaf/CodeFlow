export class Base {
  save() {
    return 1;
  }
}

export class Child extends Base {
  #secret = 1;

  static create() {
    return new Child();
  }

  save() {
    return this.#secret;
  }

  get secret() {
    return this.#secret;
  }
}

export function run() {
  const child = new Child();
  child.save();
  return Child.create();
}
