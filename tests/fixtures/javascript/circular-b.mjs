import { a } from './circular-a.mjs';

export function b() {
  return 2;
}

export function viaA() {
  return a();
}
