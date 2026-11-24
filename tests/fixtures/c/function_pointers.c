typedef int (*math_op)(int, int);

int add(int a, int b) {
  return a + b;
}

int sub(int a, int b) {
  return a - b;
}

int run_op(int x, int y) {
  math_op handler = add;
  return handler(x, y);
}
