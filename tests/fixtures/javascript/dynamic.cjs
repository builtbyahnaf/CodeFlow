function compute(obj, key) {
  eval('var injected = 1;');
  with (obj) {
    return key;
  }
}

function indirect(fn) {
  return fn.call(null, 1);
}

function computed(obj, key) {
  return obj[key]();
}

var target = function () {
  return 1;
};

function scoped(obj) {
  with (obj) {
    target();
  }
}

function deferred(fn) {
  return setTimeout(fn, 10);
}

function schedule() {
  return new Promise((resolve) => resolve(1));
}
