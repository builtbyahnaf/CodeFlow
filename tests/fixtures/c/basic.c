typedef unsigned char byte;

enum Color {
  RED = 0,
  GREEN = 1,
  BLUE = 2
};

struct Point {
  int x;
  int y;
};

union Value {
  int i_val;
  float f_val;
};

static int internal_count = 0;

static int helper(int delta) {
  internal_count += delta;
  return internal_count;
}

int calculate(struct Point pt) {
  int res = helper(pt.x + pt.y);
  if (res > 100) {
    return 100;
  }
  return res;
}
