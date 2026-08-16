import { makeTree } from './world-geography';

export function makeWorldTrees() {
  // near pipe
  return makeTree(true).translate_(90, 25, -45)

    // near floating path
    .merge(makeTree(true).translate_(75, 35, -180))

    // near back of mountain
    .merge(makeTree().translate_(-5, 41, -190))
    .merge(makeTree().translate_(-20, 42, -215).scale_(1, 1.3).translate_(0, -10))

  // first cliff
    .merge(makeTree().translate_(-210, 26, 100))
    .merge(makeTree().scale_(1, 1.3).translate_(-230, 28, 120))


}