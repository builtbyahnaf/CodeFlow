function target() {
  return 1;
}

export function caller() {
  eval("var injected = 1;");
  return target();
}