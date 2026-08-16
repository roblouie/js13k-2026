import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {materials} from "@/textures";
import {Mesh} from "@/engine/renderer/mesh";

const bodyRadius = 2;

function catHead(dipNRot = 0) {
  const eyes = new MoldableCubeGeometry(3.8, 0.01, 3.2, 1, 1, 1)
    .texturePerSide(materials.catEye,
      materials.nothing, materials.nothing,materials.nothing,materials.nothing,materials.nothing,)

    .rotate_(1.1, 1.57, 0)


  const mouth = new MoldableCubeGeometry(6, 0.01, 6, 1, 1, 1)
    .texturePerSide(materials.catMouth,
      materials.nothing, materials.nothing,materials.nothing,materials.nothing,materials.nothing,)
    .rotate_(1.5, 1.57, 0);


  return new MoldableCubeGeometry(bodyRadius, bodyRadius, bodyRadius, 8, 8, 8)
    .texturePerSide(materials.iron)
    .spherify(bodyRadius)
    // Make ears
    .selectBy(vert => vert.z < 1.5 && vert.z > 0.5 && vert.y > 1 && Math.abs(vert.x) < 0.3)
    .translate_(0, 1.5)
    .selectBy(vert => vert.z > -1.5 && vert.z < -0.5 && vert.y > 1 && Math.abs(vert.x) < 0.3)
    .translate_(0, 1.5)

    // Flatten eye area
    .selectBy(vert => vert.x > 1 && vert.y > 0)
    .translate_(-0.4, 0.2)

    // Extend Neck
    .selectBy(vert => vert.x < 0 && vert.y < 0.3)
    .translate_(-0.7, -1)
    .merge(eyes.translate_(1.6, 0.75))
    .merge(mouth.translate_(2.1, -0.5))
    .all_()
    .translate_(0, dipNRot)
    .rotate_(0, dipNRot)
}

function catFront(leftRot = 0, rightRot = 0) {
  return new MoldableCubeGeometry(bodyRadius, bodyRadius, bodyRadius, 8, 8, 8)
    .texturePerSide(materials.iron)
    .spherify(bodyRadius)
    // Right Leg
    .selectBy(vert => vert.x < 0.5 && vert.x > -0.5 && vert.y < -0.2 && vert.z > bodyRadius / 3)
    .translate_(0, -1)
    .selectBy(vert => vert.y < -bodyRadius - 0.2)
    .translate_(0, -0.5, 1)
    .scale_(0.5, 1, 0.5)
    .selectBy(vert => vert.z > 0)
    .rotate_(0, 0, rightRot)

    // Left Leg
    .selectBy(vert => vert.x < 0.5 && vert.x > -0.5 && vert.y < -0.2 && vert.z < -bodyRadius / 3)
    .translate_(0, -1)
    .selectBy(vert => vert.y < -bodyRadius - 0.2 && vert.z < 0)
    .translate_(0, -0.5, -1)
    .scale_(0.5, 1, 0.5).selectBy(vert => vert.z < 0)
    .rotate_(0, 0, leftRot);
}

function catButt(leftRot = 0, rightRot = 0) {
  const tail = new MoldableCubeGeometry(1, 3, 1, 4, 5, 4)
    .texturePerSide(materials.iron)
    .cylindrify(0.3)
    // give tail a point
    .selectBy(vert => vert.x === 0 && vert.z === 0 && vert.y > 1)
    .translate_(0, 0.2);

  [...new Set(tail.vertices.map(vert => vert.y))].sort((a, b) => a-b).forEach((val, index) => {
    if (index > 0) {
      tail.selectBy(vert => vert.y === val)
        .translate_(Math.sin(val) * 0.5, 0, Math.sin(index * -1.5) * rightRot)
    }
  });

  return new MoldableCubeGeometry(bodyRadius, bodyRadius, bodyRadius, 8, 8, 8)
    .texturePerSide(materials.iron)
    .spherify(bodyRadius)
    // Right Leg
    .selectBy(vert => vert.x < bodyRadius / 2 && vert.y < -0.2 && vert.z > bodyRadius / 3)
    .translate_(0, -1)
    .selectBy(vert => vert.y < -bodyRadius - 0.2)
    .translate_(0, -0.5, 1)
    .scale_(0.5, 1, 0.5)
    .selectBy(vert => vert.z > 0)
    .rotate_(0, 0, rightRot)

    // Left Leg
    .selectBy(vert => vert.x < bodyRadius / 2 && vert.y < -0.2 && vert.z < -bodyRadius / 3)
    .translate_(0, -1)
    .selectBy(vert => vert.y < -bodyRadius - 0.2 && vert.z < 0)
    .translate_(0, -0.5, -1)
    .scale_(0.5, 1, 0.5)
    .selectBy(vert => vert.z < 0)
    .rotate_(0, 0, leftRot)

    // Tail
    .selectBy(vert => vert.y > bodyRadius / 2 && vert.x < -1 && Math.abs(vert.z) < 0.3)
    .translate_(-0.3, 0.2)
    .merge(tail.all_().rotate_(0, 0, 0.5).translate_(-2.3, 2.8))

}

export function makeCat() {
  const bodyRadius = 2;
  const bodyDepth = 4;

  function updateBody(frame: number) {
    const body = new MoldableCubeGeometry(bodyDepth, 1, 1, 8, 8, 8).texturePerSide(materials.iron);


    body.cylindrify(bodyRadius, 'x')
      .translate_(0, frame === 0 ? 0 : -0.05)
      .merge(catButt(frame === 0 ? 0.3 : -0.3, frame === 0 ? -0.3 : 0.3,).all_().translate_(-bodyDepth / 2))
      .merge(catFront(frame === 1 ? 0.3 : -0.3, frame === 1 ? -0.3 : 0.3).all_().translate_(bodyDepth / 2))
      .merge(catHead(frame === 0 ? 0.1 : -0.1).translate_(4, 2.9));


    body.rotate_(0, -Math.PI / 2).scale_(0.5, 0.5, 0.5).computeNormals();

    return body.done_();
  }

  const body = updateBody(0);
  const frame2 = updateBody(1)
  body.addFrame(1, frame2.vertices);


  const mesh = new Mesh(
    body
    , materials.iron
  );
  mesh.frameA = 0;
  mesh.frameB = 1;

  return mesh;
}