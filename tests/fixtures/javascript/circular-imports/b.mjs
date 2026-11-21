import { a } from './a.mjs';

export function b() {
  return 1;
}

export function viaA() {
  return a();
}