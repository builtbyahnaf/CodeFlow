int helper(int n) { return n + 1; }

int classify(int n) {
  if (n < 0) {
    return -1;
  } else if (n == 0) {
    return 0;
  }
  for (int i = 0; i < n; i++) {
    if (i == 3) continue;
    if (i > 5) break;
  }
  switch (n) {
    case 1:
      return 10;
    case 2:
      return 20;
    default:
      break;
  }
  n = helper(n) > 100 ? 100 : n;
  return n;
}

int guarded(int* p) {
  if (!p) {
    throw "null";
  }
  try {
    return *p;
  } catch (...) {
    return -1;
  }
}
