import { helper, VERSION } from './util.js';
import * as math from './math.js';

export const doubled = helper(VERSION);

export function compute(value) {
  return math.add(doubled, helper(value));
}

export default compute;
