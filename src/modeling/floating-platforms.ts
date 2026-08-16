import {materials} from "@/textures";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {cylinderSelector2} from "./building-blocks";

export const platformMaker = (rad: number) => new MoldableCubeGeometry(4, rad/2, 4, 6, 1, 6).texturePerSide(materials.brickWall)
  .selectBy(cylinderSelector2()).cylindrify(rad)
  .selectBy(vert => vert.y < 0).scale_(0, 1, 0).all_()
