export function loop() {
  const fns = [];
  for (var i = 0; i < 3; i += 1) {
    fns.push(function () {
      return i;
    });
  }
  let j = 0;
  const arrow = () => j;
  return { fns, arrow };
}