#include "widget.h"
#include <vector>

namespace math {
  int add(int a, int b) { return a + b; }
  int square(int n) { return add(n, n); }
}

class Widget {
public:
  int count;
  virtual int save() { return count; }
  int plain() { return 1; }
};

int callThroughPointer(int (*fn)(int), int value) {
  return fn(value);
}

template <typename T>
T identity(T value) { return value; }

int main() {
  math::square(4);
  Widget widget;
  widget.save();
  widget.plain();
  return callThroughPointer(identity<int>, 1);
}
