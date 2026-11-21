export function naïve(函数) {
  return 函数 + 1;
}

export const café = naïve(2);

export class Café {
  order(name) {
    return naïve(name.length);
  }
}
