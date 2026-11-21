const { helper: utilHelper } = require('./util.cjs');

const local = require('./util.cjs');

function add(a, b) {
  return utilHelper(a) + local.helper(b);
}

module.exports = { add };
module.exports.local = local;
