import primary, { helper as renamed } from './util.js';
import * as ns from './util.js';

export const value = primary(1) + renamed(2) + ns.helper(3);