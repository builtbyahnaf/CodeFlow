export async function load() {
  const namespace = await import('./util.js');
  return namespace.value;
}