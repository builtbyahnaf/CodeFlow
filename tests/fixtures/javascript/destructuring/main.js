export function unpack(source) {
  const { a: renamed, b = 2 } = source;
  const [first, ...rest] = source.list;
  return { renamed, b, first, rest };
}