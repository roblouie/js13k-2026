import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import { materials } from '@/textures';
import {makePlinth} from "@/modeling/world-geography";

export const makeBridgePiece = (depth: number, scaleY: number, scaleZ: number) => {
  return new MoldableCubeGeometry(depth, 40, 50, 1, 1, 8)
    .selectBy(vert => vert.y < 0 && Math.abs(vert.z) < 14)
    .cylindrify(15, 'x', { x: 0, y: -40, z: 0})
    .selectBy(vert => vert.y > 19)
    .cylindrify(20, 'x')
    .selectBy(vert => vert.y > 0)
    .scale_(1, scaleY, scaleZ);
};

export function bridge() {
  return makeBridgePiece(20, 1.3, 2).texturePerSide(materials.brickWall).spreadTextureCoords(20, 20)
      .merge(makeBridgePiece(2, 1.3, 2).texturePerSide(materials.brickWall).all_().translate_(9, 3).spreadTextureCoords(20, 20))
      .merge(makeBridgePiece(2, 1.3, 2).texturePerSide(materials.brickWall).all_().translate_(-9, 3).spreadTextureCoords(20, 20))

      .merge(new MoldableCubeGeometry(1, 38, 35).texturePerSide(materials.bars).spreadTextureCoords(3))

      // platform behind bridge
      .merge(
        makePlinth(26, 10, materials.brickWall, 4)
          .merge(makePlinth(14, 10, materials.brickWall, 4).translate_(0,0,-20))
          .all_()
          .translate_(-54, -20, 25)
          .done_()
      )

      .all_()

      .translate_(-190, 20, 9)
      .done_();
}
