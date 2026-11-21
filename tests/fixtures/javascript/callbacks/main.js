function invoke(handler) {
  return handler(1);
}

export function run() {
  return invoke((value) => value + 1);
}

export function deferred(handler) {
  return setTimeout(handler, 10);
}