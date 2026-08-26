import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import { materials } from '@/textures';
import { Mesh } from '@/engine/renderer/mesh';
import { AttributeLocation } from '@/engine/renderer/renderer';
import {clamp, radsToDegrees, smoothstep} from '@/engine/helpers';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';

const bodyRadius = 3;

function horseTail(frame: number) {
    const tail = new MoldableCubeGeometry(4, 4, 4, 6, 5, 6)
        .texturePerSide(materials.witchClothes)
        .capsulify(0.6, 6, 0.5)
    ;

    const rows = [...new Set(tail.vertices.map(v => v.y))]
        .sort((a, b) => b - a);

    rows.forEach((val, index) => {
        const vertices = tail.selectBy(vert => vert.y === val);
        const t = index / (rows.length - 1);

        if (index === 0 || index === rows.length - 1) {
            vertices.translate_(
                index ? Math.sin(index + frame) : 0,
                index ? -1 : 1
            );
        } else {
            const scale = .8 + Math.sin(t * Math.PI);
            vertices
                .translate_(Math.sin(t * Math.PI * 2 + frame) * .4, 0, Math.sin(t * Math.PI * frame) * .2)
                .scale_(scale, 1, scale);
        }
    });

    tail.all_().rotate_(0, 0, -1).translate_(-11.4, 2.1);

    return tail;
}

function newHorseHead(frame: number) {
    const horseEar = () => new MoldableCubeGeometry(1, 1, 1, 2, 2, 2)
        .spherify(0.9)
        .scale_(0.6, 1, 0.6)
        .selectBy(vert => vert.x > 0)
        .translate_(-0.5)
        .selectBy(vert => vert.y > 0.7)
        .translate_(0, 0.3, 0.1)
        .all_()
        .texturePerSide(materials.white);

    const horn = new MoldableCubeGeometry(1, 2, 1, 3, 3, 3)
        .texturePerSide(materials.rainbow)
        .capsulify(0.4, 5, 0.8)
        .rotate_(0, 0, -0.5)
        .spreadTextureCoords(4, -4, -0.3, -0.35)
        .rotate_(0, 0, -0.3)
        .translate_(11, 10);

    const eye = (isLeft: boolean) => new MoldableCubeGeometry(1, 1, 4, 1, 1, 1)
        .texturePerSide(materials.nothing,
            materials.nothing, materials.nothing,materials.nothing, isLeft ? materials.nothing : materials.horseEye, isLeft ? materials.horseEye : materials.nothing)
        .rotate_(0, isLeft ? -0.9 : 0.9, 0.4)
        .translate_(9, 7.3);

    const mane = new MoldableCubeGeometry(3, 1, 1, 3, 9, 8)
        .texturePerSide(materials.witchClothes)
        .capsulify(1.9, 6, 0.6)
        .rotate_(0, 0, 1.57)
        .selectBy(vert => vert.y < 0)
        .scale_(1, 1, 1.2)
        .selectBy(vert => vert.y > 1.2 && vert.x < 3)
        .scale_(1, 1, 1.55)
        .selectBy(vert => vert.y > 0.5 && vert.x < 1)
        .scale_(1, 1, 0.7)

        .selectBy(vert => vert.y > 1.5 && vert.x < 1)
        .all_()
        .modifyEachVertex(vert => {
            const topApplication = smoothstep(1, 1.5, vert.y);
            const backApplication = smoothstep(3, 2, vert.x);
            vert.y += Math.sin(vert.x + 1 + frame * topApplication * backApplication) * 0.5;
            vert.z += Math.cos(vert.x + frame) * topApplication * backApplication * 0.3;
        })
        .rotate_(0, 0, 0.6)
        .translate_(5.7, 7.1);

    const horseHead = new MoldableCubeGeometry(1, 1, 1, 8, 14, 8)
        .capsulify(1.8, 3.2, 0.5)
        .rotate_(0, 0, 1.57)
        .modifyEachVertex(vert => {
            const noseApplicationPerfecnt = smoothstep(-1, 3.3, vert.x);
            const bottomApplicationPercent = smoothstep(0, -3, vert.y);

            const scaleMatrix = new DOMMatrix().scaleSelf(1, 1 - noseApplicationPerfecnt * bottomApplicationPercent * 0.3, 1 - noseApplicationPerfecnt * 0.4);
            vert.set(scaleMatrix.transformPoint(vert));

            if (vert.x > 0 && vert.x < 4) {
                vert.y += vert.x * bottomApplicationPercent * 0.6;
            }

            if ( vert.y < 0) {
                const cheekXApplication = smoothstep(0.5, -2, vert.x);
                vert.y -= clamp(Math.sin(vert.x * 0.4 - 5.5), 0, 1) * 2 * cheekXApplication;
            }

            if (vert.x > 3) {
                vert.y += 0.3;
                // const noseEndScale = new DOMMatrix().scaleSelf(1, 1.8, 1.5);
                // vert.set(noseEndScale.transformPoint(vert));
            }
        })
        .all_()

        .texturePerSide(materials.horseFace)
        .rotate_(0, 0, -1.57)
        .translate_(11.7, 0.4)
        .rotate_(0, 0, 0.6)
        .merge(horseEar().rotate_(-0.1, 0, -0.6).translate_(9, 10.1, -1))
        .merge(horseEar().rotate_(0.1, 0, -0.6).translate_(9, 10.1, 1))
        .merge(horn)
        .merge(eye(true))
        .merge(eye(false))
        .merge(mane)

    return horseHead;
}

function makeHorseFrontLeg(isLeft: boolean, frame: number) {
    const upperRotations = [0.7, 0.0, -0.2, 0.6];
    const lowerRotations = [-0.1, 0, -0.5, -1.3];

    const leftIndex = (frame + upperRotations.length + 1) % upperRotations.length;
    const activeFrame = isLeft ? leftIndex : frame;

    const upperAngle = radsToDegrees(upperRotations[activeFrame]);

    const lowerAngle = radsToDegrees(lowerRotations[activeFrame]);

    const upperMatrix = new DOMMatrix().translateSelf(0, 2, 0)
        .rotateSelf(0, 0, upperAngle)
        .translateSelf(0, -2, 0);

    const kneePosition = new EnhancedDOMPoint(0, -3.5, 0);
    const rotatedKnee = upperMatrix.transformPoint(kneePosition);

    const lowerLocalMatrix = new DOMMatrix()
        .translateSelf(rotatedKnee.x, rotatedKnee.y, rotatedKnee.z)
        .rotateSelf(0, 0, lowerAngle)
        .translateSelf(-rotatedKnee.x, -rotatedKnee.y, -rotatedKnee.z);

    const lowerMatrix = lowerLocalMatrix.multiply(upperMatrix);

    return new MoldableCubeGeometry(1, 2, 1, 8, 8, 8)
        .texturePerSide(materials.white)
        .capsulify(1, 4, 0.3)
        .modifyEachVertex(vert => {
            const upperApplication = smoothstep(-2, 1, vert.y);
            const frontApplication = smoothstep(0, 1, vert.x);
            const transform = Math.sin(vert.y * 0.3 + 0.8) * upperApplication * frontApplication;
            vert.x +=  transform;
            vert.z -= transform * 0.3 * (isLeft ? -1 : 1);

            vert.set(upperMatrix.transformPoint(vert));
        })
        .merge(new MoldableCubeGeometry(1, 1, 1, 3, 3,3)
            .texturePerSide(materials.rainbow)
            .spherify(1)
            .translate_(0, -2.8)
            .modifyEachVertex(vert => vert.set(upperMatrix.transformPoint(vert)))
        )
        .merge(
            new MoldableCubeGeometry(1, 2, 1, 5, 5, 5)
                .texturePerSide(materials.white)
                .capsulify(0.8, 3, 0.4)
                .translate_(0, -5)
                .modifyEachVertex(vert => vert.set(lowerMatrix.transformPoint(vert)))

        ).merge(
            new MoldableCubeGeometry(1, 1.2, 1, 3, 1, 3)
                .texturePerSide(materials.hooves)
                .cylindrify(0.85, 'y')
                .selectBy(vert => vert.y < 0)
                .scale_(1.3, 1, 1.3)
                .translate_(0.5, 0, 0)
                .all_()
                .translate_(0, -7)
                .modifyEachVertex(vert => vert.set(lowerMatrix.transformPoint(vert)))
        ).all_();
}

function makeHorseRearLeg(isLeft: boolean, frame: number) {
    const upperRotations = [-0.9, 0.3, 0.5, 0.0];
    const lowerRotations = [0.5, 0.8, -0.1, 0];

    const leftIndex = (frame + upperRotations.length + 1) % upperRotations.length;
    const activeFrame = isLeft ? leftIndex : frame;

    const upperAngle = radsToDegrees(upperRotations[activeFrame]);

    const lowerAngle = radsToDegrees(lowerRotations[activeFrame]);

    const upperMatrix = new DOMMatrix().translateSelf(0, 2, 0)
        .rotateSelf(0, 0, upperAngle)
        .translateSelf(0, -2, 0);

    const kneePosition = new EnhancedDOMPoint(0, -3.5, 0);
    const rotatedKnee = upperMatrix.transformPoint(kneePosition);

    const lowerLocalMatrix = new DOMMatrix()
        .translateSelf(rotatedKnee.x, rotatedKnee.y, rotatedKnee.z)
        .rotateSelf(0, 0, lowerAngle)
        .translateSelf(-rotatedKnee.x, -rotatedKnee.y, -rotatedKnee.z);

    const lowerMatrix = lowerLocalMatrix.multiply(upperMatrix);

    return new MoldableCubeGeometry(1, 2, 1, 8, 8, 8)
        .texturePerSide(materials.white)
        .capsulify(1.1, 4, 0.3)
        .modifyEachVertex(vert => {
            const upperApplication = smoothstep(-2, 1, vert.y);
            const frontApplication = smoothstep(0, 1, vert.x);
            const rearApplication = smoothstep(0, -1, vert.x);
            const transform = Math.sin(vert.y * 0.3 + 0.8) * upperApplication;
            const frontTransform = transform * frontApplication;
            const rearTransform = transform * rearApplication;
            vert.x +=  frontTransform * 2;
            vert.x -= rearTransform * 0.5;
            vert.z -= rearTransform * 0.5 * (isLeft ? 1 : -1);

            const lowerApplication = smoothstep(2, 1, vert.y);
            const upperExcludingThighMatrix = new DOMMatrix().translateSelf(0, 2, 0)
                .rotateSelf(0, 0, upperAngle * lowerApplication)
                .translateSelf(0, -2, 0);

            vert.set(upperExcludingThighMatrix.transformPoint(vert));
        })
        // .selectBy(vert => vert.y > 1.5)
        // .spherify(1.8, new EnhancedDOMPoint(0, 2.5, 0))
        // .all_()
        // lower leg
        .merge(new MoldableCubeGeometry(1, 1, 1, 3, 3,3)
            .texturePerSide(materials.rainbow)
            .spherify(1)
            .translate_(0, -2.8)
            .modifyEachVertex(vert => vert.set(upperMatrix.transformPoint(vert)))
        )
        .merge(
            new MoldableCubeGeometry(1, 2, 1, 5, 5, 5)
                .texturePerSide(materials.white)
                .capsulify(0.8, 3, 0.4)
                .translate_(0, -5)
                .modifyEachVertex(vert => vert.set(lowerMatrix.transformPoint(vert)))
        )
        .merge(
            new MoldableCubeGeometry(1, 1.2, 1, 3, 1, 3)
                .texturePerSide(materials.hooves)
                .cylindrify(0.85, 'y')
                .selectBy(vert => vert.y < 0)
                .scale_(1.3, 1, 1.3)
                .translate_(0.5, 0, 0)
                .all_()
                .translate_(0, -7)
                .modifyEachVertex(vert => vert.set(lowerMatrix.transformPoint(vert)))
        ).all_();
}

export function makeHorse() {
    const bodyDepth = 12;

    function updateBody(frame: number) {

        const headBob = Math.sin((frame) - 2.7) * 0.8;
        const bodyBob = -(frame) / 5;

        const body = new MoldableCubeGeometry(1, 1, 1, 12, 20, 12)
            .texturePerSide(materials.white);

        body
            .capsulify(bodyRadius - 0.3, bodyDepth, 0.5)
            .rotate_(0, 0, 1.57)
            .modifyEachVertex((vert) => {
                const topApplicationPercent = smoothstep(0, 2, vert.y);
                vert.y += (Math.sin(vert.x * 0.6 + 4.4) * (0.7)) * topApplicationPercent;


                const bottomApplicationPercent = smoothstep(0, -3, vert.y);
                const bottomScaleMatrix = new DOMMatrix().scaleSelf(1, 1, 1 + bottomApplicationPercent * 0.3);
                vert.y -= (Math.sin(vert.x * 0.5 + 0.8) + 0.5) * bottomApplicationPercent;
                vert.set(bottomScaleMatrix.transformPoint(vert));

                const neckApplicationPercent = smoothstep(3, 8, vert.x);

                const scaleMatrix = new DOMMatrix().scaleSelf(1 - neckApplicationPercent * 0.2, 1.0, 1 - neckApplicationPercent * 0.4);
                const scaled = scaleMatrix.transformPoint(vert);
                vert.set(scaled);

                vert.y += Math.sin(vert.x * 0.2) * 3.5 * neckApplicationPercent;
                vert.x += 1.5 * neckApplicationPercent + headBob * neckApplicationPercent;

                vert.x += Math.sin(vert.x * 0.4) * neckApplicationPercent * bottomApplicationPercent;

                if (vert.x > -4 && vert.x < 6) {
                    vert.z *= 0.8 + Math.abs(Math.sin(vert.x * 0.5 + 1) * 0.3);
                }
            })
            .modifyEachVertex(vert => {
                const xApplication = smoothstep(0, 5, vert.x);
                const yApplication = smoothstep(-1, -4, vert.y);
                /// shape chest
                vert.x += Math.abs(Math.sin(vert.x) * 0.3 + 1.9) * xApplication * yApplication * 1.6;
                // const scaleMatrix = new DOMMatrix().scaleSelf(1, 1.0, 1 + xApplication * yApplication * 0.22);
                // vert.set(scaleMatrix.transformPoint(vert));
            })

            .all_()
            .rotate_(0, 0, 0.07)
            .spreadTextureCoords()
            .translate_(-0.4, 2.5 + bodyBob)
            .merge(
                makeHorseFrontLeg(false, frame).translate_(3.5, -1.5, 1.3))
            .merge(makeHorseFrontLeg(true, frame).translate_(3.5, -1.5, -1.3))
            .merge(makeHorseRearLeg(false, frame).translate_(-7, -1.5, -1.4))
            .merge(makeHorseRearLeg(true, frame).translate_(-7, -1.5, 1.4))
            .merge(horseTail(frame).translate_(0, bodyBob))
            .merge(newHorseHead(frame).translate_(headBob, bodyBob, 0));


    body.scale_(0.3, 0.3, 0.3);

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
        , materials.white
    );
    mesh.frameA = 0;
    mesh.frameB = 1;

    return mesh;
}
