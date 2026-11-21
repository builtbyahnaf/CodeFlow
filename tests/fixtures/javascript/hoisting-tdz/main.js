export function hoisted() {
  return later();
}

export function later() {
  return 1;
}

export function tdz() {
  return before;
}

const before = 2;