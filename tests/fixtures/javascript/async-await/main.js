export async function load() {
  const value = await Promise.resolve(1);
  return value;
}