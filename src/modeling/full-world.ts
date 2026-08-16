import { Mesh } from '@/engine/renderer/mesh';
import { materials } from '@/textures';
import { bridge } from './bridges';

export function makeWorld() {
  return new Mesh(
    bridge()
      .done_()
  , materials.cartoonGrass);
}
