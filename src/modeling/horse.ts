import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import { materials } from '@/textures';
import { Mesh } from '@/engine/renderer/mesh';
import { AttributeLocation } from '@/engine/renderer/renderer';

const bodyRadius = 3;

function horseHead(dipNRot = 0) {
  const eyes = new MoldableCubeGeometry(1, 1, 4, 1, 1, 1)
    .texturePerSide(materials.nothing,
      materials.nothing, materials.nothing,materials.nothing,materials.horseEye,materials.horseEye,)
    .translate_(1, 0.8)
    .rotate_(0, 0.3, -0.5)


  const horn = new MoldableCubeGeometry(1, 2, 1, 3, 3, 3)
    .texturePerSide(materials.rainbow)
    .capsulify(0.4, 5, 0.8)
    .rotate_(0, 0, -0.5)
    .spreadTextureCoords(4, -4, -0.3, -0.35)
    .rotate_(0, 0, -0.3)
    .translate_(2, 2);


  return new MoldableCubeGeometry(2, 2, 2, 8, 8, 8)
    .texturePerSide(materials.witchClothes)
    .spherify(2)
    // Make ears
    .selectBy(vert => vert.z < 1.5 && vert.z > 0.5 && vert.y > 1 && Math.abs(vert.x) < 0.3)
    .translate_(0.5, 1.5)
    .selectBy(vert => vert.z > -1.5 && vert.z < -0.5 && vert.y > 1 && Math.abs(vert.x) < 0.3)
    .translate_(0.5, 1.5)

    // Flatten eye area
    // .selectBy(vert => vert.x > 1 && vert.y < 0)
    // .translate_(-0.4, 0.2)

    // extend neck
    .selectBy(vert => vert.x < -1.0 && vert.y < 0)
    .scale_(1.0, 3.5, 1.0)
    .translate_(-2.9, -2.8)
    .selectBy(vert => vert.x < -1.0 && vert.y >= 0)
    .scale_(1.0, 3.2, 1.0)
    .translate_(-5.5, -8.5)

    // Extend face
    .selectBy(vert => vert.x > 0.1 && vert.y < 0.6 && Math.abs(vert.z) < 1.5)
    .scale_(0.5, 0.5, 0.5)
    .translate_(2, -3.2)
    .merge(eyes)
    // .merge(mouth.translate_(2.1, -0.5))
    .merge(horn)
    .selectBy(vert => vert.x > -0.5)
    .rotate_(0, 0, dipNRot)
    .all_()
    .translate_(0, dipNRot);
}

function horseFront(frame: number) {
  const upperRotations = [0.7, 0.0, -0.2, 0.6];
  const lowerRotations = [-0.1, 0, -0.5, -1.3];
  const lowerTranslations = [
    [0, -8, 1],
    [0.2, -8, 1],
    [-1.1, -8, 1],
    [-3, -6.8, 1],
  ];

  const leftIndex = (frame + upperRotations.length + 1) % upperRotations.length;

  return new MoldableCubeGeometry(bodyRadius, bodyRadius, bodyRadius, 8, 8, 8)
    .texturePerSide(materials.witchClothes)
    .spherify(bodyRadius)
    // Right Leg
    // - extend down upper part of leg
    .selectBy(vert => vert.x < 3.5 && vert.x > -0.5 && vert.y < 0 && vert.z > 0)
    .scale_(0.3)
    .translate_(0, -3.5, 1)
    .scale_(1.0, 1, 0.5)

    .invertSelection()
    // .translate_(1)
    .all_()

    // - add lower part of leg
    .merge(
      new MoldableCubeGeometry(1, 6, 1, 6, 5, 6)
        .capsulify(0.5, 5.5, 0.1)
        .rotate_(0, 0, lowerRotations[frame])
        .translate_(...lowerTranslations[frame])
        .texturePerSide(materials.witchClothes)
    )

    // - handle rotation
    .selectBy(vert => vert.z > 0)
    .rotate_(0, 0, upperRotations[frame])

    // Left Leg
    // - extend down upper part of leg
    .selectBy(vert => vert.x < 3.5 && vert.x > -0.5 && vert.y < 0 && vert.z < 0)
    .scale_(0.3)
    .translate_(0, -3.5, -1)
    .scale_(1.0, 1, 0.5)



    // - add lower part of leg
    .merge(
      new MoldableCubeGeometry(1, 6, 1, 6, 5, 6)
        .capsulify(0.5, 5.5, 0.1)
        .rotate_(0, 0, lowerRotations[leftIndex])
        .translate_(lowerTranslations[leftIndex][0], lowerTranslations[leftIndex][1], -lowerTranslations[leftIndex][2])
        .texturePerSide(materials.witchClothes)
    )

    // - handle rotation
    .selectBy(vert => vert.z < 0)
    .rotate_(0, 0, upperRotations[leftIndex])
    .spreadTextureCoords();
}

function horseButt(frame: number) {
  const upperRotations = [-0.9, 0.3, 0.5, 0.0];
  const lowerRotations = [0.5, 0.8, -0.1, 0];
  const lowerTranslations = [
    [1.1, -8, 1],
    [1, -6.8, 1],
    [0, -8, 1],
    [0.2, -8, 1],
  ];

  // const frame = (frameNum + 3) % upperRotations.length;
  const leftIndex = (frame + upperRotations.length + 1) % upperRotations.length;

  const tail = new MoldableCubeGeometry(4, 4, 4, 6, 5, 6)
    .texturePerSide(materials.rainbow)
    .spreadTextureCoords(4, 4, -0.4, -0.4)
    .capsulify(0.6, 6, 0.5)
  ;

  [...new Set(tail.vertices.map(vert => vert.y))].sort((a, b) => b-a).forEach((val, index) => {
    const vertices = tail.selectBy(vert => vert.y === val);
    if (index === 0 || index === 5) {
      vertices.translate_(index === 5 ? Math.sin(index + frame) * 1 : 0, index === 0 ? 1 : -1)
    } else {
      const scale = 0.8 + Math.abs(Math.sin(index -1));
      vertices.translate_(Math.sin(index + frame) * 0.4, 0)
      vertices.scale_(scale, 1, scale)
    }
  });

  tail.all_().rotate_(0, 0, -1).translate_(-5.5, -0.3);

  return new MoldableCubeGeometry(bodyRadius, bodyRadius, bodyRadius, 8, 8, 8)
    .texturePerSide(materials.witchClothes)
    .spherify(bodyRadius)
    // Right Leg
    .selectBy(vert => vert.x < 1.5 && vert.y < -0.2 && vert.z > 0)
    .translate_(0, -3)


    // extend down upper part of leg
    .selectBy(vert => vert.y < -bodyRadius - 0.2)
    .translate_(0, -0.5, 1)
    .scale_(0.5, 1, 0.5)

    // extend down lower part of leg
    .merge(
      new MoldableCubeGeometry(1, 6, 1, 6, 5, 6)
        .capsulify(0.6, 5.5, 0.1)
        .rotate_(0, 0, lowerRotations[frame])
        .translate_(...lowerTranslations[frame])
        .texturePerSide(materials.witchClothes)
    )

    // handle leg rotation
    .selectBy(vert => vert.z > 0)
    .rotate_(0, 0, upperRotations[frame])

    // Left Leg
    .selectBy(vert => vert.x < 1.5 && vert.y < -0.2 && vert.z < 0)
    .translate_(0, -3)

    // extend down upper part of leg
    .selectBy(vert => vert.y < -bodyRadius - 0.2 && vert.z < 0)
    .translate_(0, -0.5, -1)
    .scale_(0.5, 1, 0.5)

    // extend down lower part of leg
    .merge(
      new MoldableCubeGeometry(1, 6, 1, 6, 5, 6)
        .capsulify(0.6, 5.5, 0.1)
        .rotate_(0, 0, lowerRotations[leftIndex])
        .translate_(lowerTranslations[leftIndex][0], lowerTranslations[leftIndex][1], -lowerTranslations[leftIndex][2])
        .texturePerSide(materials.witchClothes)
    )

    // handle leg rogation
    .selectBy(vert => vert.z < 0)
    .rotate_(0, 0, upperRotations[leftIndex])

    // Tail
    // .selectBy(vert => vert.y > bodyRadius / 2 && vert.x < -1 && Math.abs(vert.z) < 0.3)
    // .translate_(-0., 0.2)
    .merge(tail);

}

export function makeHorse() {
  const bodyDepth = 9;

  function updateBody(frame: number) {
    const body = new MoldableCubeGeometry(1, 1, 1, 6, 6, 6)
      .texturePerSide(materials.witchClothes);


    body
      .capsulify(bodyRadius, bodyDepth - 1.5, 0.3)
      .rotate_(0, 0, 1.57)
      .selectBy(vert => vert.x < -3)
      .scale_(1.0, 0.8, 0.8)
      .translate_(0, 0.4)

      .selectBy(vert => vert.x === 0)
      .translate_(0, -0.5)

      .all_()
      .spreadTextureCoords()
      .translate_(0, 3 - (frame % 2) / 5)
      .merge(horseButt(frame).all_().translate_(-bodyDepth / 2, 2.8))
      .merge(horseFront(frame).all_().translate_(bodyDepth / 2, 2.8))
      .merge(horseHead(frame === 0 ? 0.1 : -0.1).translate_(9.5, 9));


    body.scale_(0.35, 0.5, 0.5);

    return body.rotate_(0, -Math.PI / 2).computeNormals(true).done_();
  }

  const body = updateBody(0);
  const frame2 = updateBody(1);
  const frame3 = updateBody(2);
  const frame4 = updateBody(3);
  body.addFrame(1, frame2.vertices);
  body.setAttribute_(AttributeLocation.Normals2, frame2.getAttribute_(AttributeLocation.Normals).data, 3);
  body.addFrame(2, frame3.vertices);
  body.setAttribute_(AttributeLocation.Normals3, frame3.getAttribute_(AttributeLocation.Normals).data, 3);
  body.addFrame(3, frame4.vertices);
  body.setAttribute_(AttributeLocation.Normals4, frame4.getAttribute_(AttributeLocation.Normals).data, 3);


  const mesh = new Mesh(
    body
    , materials.witchClothes
  );
  mesh.frameA = 0;
  mesh.frameB = 1;

  return mesh;
}
