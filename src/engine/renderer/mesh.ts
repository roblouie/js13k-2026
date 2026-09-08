import { Object3d } from './object-3d';
import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import {Texture} from "@/engine/renderer/texture";

export class Mesh extends Object3d {
  geometry: MoldableCubeGeometry;
  frameA = 0;
  frameB = 1;
  alpha = 0;

  // TODO: CHECK IF NEEDED, JUST USE TEXTURE PER SIDE
  constructor(geometry: MoldableCubeGeometry) {
    super();
    this.geometry = geometry;
  }
}
