export class Base {
  save() {
    return 1;
  }
}

export class Child extends Base {
  save() {
    return 2;
  }
}

export function run() {
  const child = new Child();
  return child.save();
}