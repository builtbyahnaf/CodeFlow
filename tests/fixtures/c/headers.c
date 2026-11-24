#include "headers.h"

int compute_header_value(int base) {
  return base * 2;
}

int use_header(int val) {
  return compute_header_value(val) + 1;
}
