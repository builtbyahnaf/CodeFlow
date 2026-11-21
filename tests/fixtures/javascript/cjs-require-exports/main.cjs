const { helper } = require('./util.cjs');

function add(a, b) {
  return helper(a) + helper(b);
}

module.exports = { add };