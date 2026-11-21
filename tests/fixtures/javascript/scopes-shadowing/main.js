export function shadow(value) {
  const outer = value;
  {
    const value = 2;
    return outer + value;
  }
}
