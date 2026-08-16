import { Mesh } from '@/engine/renderer/mesh';
import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import {materials} from "@/textures";
import { cylinderSelector2 } from './building-blocks';
import { Material } from '@/engine/renderer/material';

export const geoTexPerSide = () => [materials.cartoonRockWall, materials.cartoonRockWall, materials.cartoonGrass, materials.cartoonRockWall, materials.cartoonRockWall, materials.cartoonRockWall];

export function makeFloor() {
  const floorGeo = new MoldableCubeGeometry(512, 1, 512, 1, 1, 1, 1)
  return new Mesh(floorGeo
      .texturePerSide(materials.cartoonGrass)
      .spreadTextureCoords(40, 40).computeNormals().done_(), materials.cartoonGrass);
}

export function makePlinth(height: number, radius: number, texture: Material, sides = 2) {
  return new MoldableCubeGeometry(4, height, 4, sides, 1, sides)
    .selectBy(cylinderSelector2(2))
    .cylindrify(radius)
    .texturePerSide(texture)
    .all_()
    .translate_(0, height / 2)
    .spreadTextureCoords()
    .computeNormals();
}

export function makeTree(isRound?:boolean) {
  const base = new MoldableCubeGeometry(4, isRound ? 4 : 30, 4, 3, isRound ? 3 : 1, 3)

    .texturePerSide(materials.shrubs);

  if (isRound) {
    base.spherify(12)
  } else {
    base.selectBy(cylinderSelector2())
      .cylindrify(12)
      .selectBy(vert => vert.y > 0)
      .scale_(0.5, 1, 0.5)

  }

  return base.all_().translate_(0, 25).spreadTextureCoords().merge(
    new MoldableCubeGeometry(4, 15, 4, 3, 1, 3)
      .selectBy(cylinderSelector2())
      .spreadTextureCoords()

      .cylindrify(2)
      .all_()
      .translate_(0, 8)
      .texturePerSide(materials.wood)
  )

    .computeNormals(true)
}


