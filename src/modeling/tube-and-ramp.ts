import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {Material} from "@/engine/renderer/material";

export function tubify(innerRadius: number, outerRadius: number, height: number, texture: Material) {
  return new MoldableCubeGeometry(4, height, 40, 1, 1, 6).texturePerSide(texture).translate_(-20).spreadTextureCoords(20, 20)
    .merge(new MoldableCubeGeometry(38, height, 6.4, 6).texturePerSide(texture).translate_(1, 0, 16.8).spreadTextureCoords(20, 20))
    .merge(new MoldableCubeGeometry(38, height, 6.4, 6).texturePerSide(texture).translate_(1, 0, -16.8).spreadTextureCoords(20, 20))
    .selectBy(vertex => Math.abs(vertex.x) <= 19 && Math.abs(vertex.z) <= 19)
    .cylindrify(innerRadius)
    .invertSelection()
    .cylindrify(outerRadius)
    .all_()
    .done_();
}

export function rampSection(startingPoint: number, steepnessModifier: number, innerRadius: number, outerRadius: number) {
  const depth = 40;
  return new MoldableCubeGeometry(1, 1, depth, 1, 1, 6)
    .selectBy(vert => vert.y > 0)
    .modifyEachVertex(vert => vert.y = vert.z * steepnessModifier + (depth / 2) * steepnessModifier + startingPoint)
    .all_()
    .translate_(-10)
    .selectBy(vertex => Math.abs(vertex.x) <= 10)
    .cylindrify(innerRadius)
    .invertSelection()
    .cylindrify(outerRadius)
    .all_()
    .done_();
}

