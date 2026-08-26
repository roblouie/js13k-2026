import {State} from '@/core/state';
import {Scene} from '@/engine/renderer/scene';
import {Camera} from '@/engine/renderer/camera';
import {meshToFaces} from '@/engine/physics/parse-faces';
import {render} from '@/engine/renderer/renderer';
import {OctreeNode} from "@/engine/physics/octree";
import {ThirdPersonPlayer} from "@/core/third-person-player";

import {makeWorld} from "@/modeling/full-world";
import {makeFloor} from "@/modeling/world-geography";
import {gl} from "@/engine/renderer/lil-gl";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {heightmap, materials} from "@/textures";
import {Mesh} from "@/engine/renderer/mesh";
import {makeGrassMountainRegion} from "@/engine/svg-maker/svg-string-converters";
import {clamp, inverseLerp, smoothstep} from "@/engine/helpers";
import {textureLoader} from "@/engine/renderer/texture-loader";

type WorldArea = { startWorldZ: number, data: Uint8Array, filledCount: number };

export class GameState implements State {
  player: ThirdPersonPlayer;
  scene: Scene;

  private areaTextureSize = 128;
  private areaTextureArea = this.areaTextureSize * this.areaTextureSize;
  private areaWorldSize = 300;
  private areaBaseOffset = this.areaWorldSize / 2;
  private worldRevealTextureSize = { width: 128, height: 896 };
  private worldRevealedData = new Uint8Array(this.worldRevealTextureSize.width * this.worldRevealTextureSize.height);

  private areas: WorldArea[] = [
    {
      startWorldZ: 0,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, 0, this.areaTextureArea),
    },
    {
      startWorldZ: this.areaWorldSize,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea, this.areaTextureArea),
    },
    {
      startWorldZ: this.areaWorldSize * 2,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 2, this.areaTextureArea)
    },
    {
      startWorldZ: this.areaWorldSize * 3,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 3, this.areaTextureArea)
    },
    {
      startWorldZ: this.areaWorldSize * 4,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 4, this.areaTextureArea)
    },
    {
      startWorldZ: this.areaWorldSize * 5,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 5, this.areaTextureArea)
    },
    {
      startWorldZ: this.areaWorldSize * 6,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 6, this.areaTextureArea)
    },
  ];

  constructor() {
    this.scene = new Scene();
    //this.player = new FreeCam(new Camera(Math.PI / 3, 16 / 9, 1, 500));

    this.player = new ThirdPersonPlayer(new Camera(Math.PI / 2.5, 16 / 9, 1, 700));

    this.octree = new OctreeNode({
      max: {x: 150, y: 0, z: 2100, w: 1},
      min: { x: -150, y: 0, z: 0 }
    }, 0);

    // for (let i = 0; i < 16384; i++) {
    //   this.worldRevealedData[i] = 0xff;
    // }

    const worldRevealTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, worldRevealTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, this.worldRevealTextureSize.width, this.worldRevealTextureSize.height, 0, gl.RED, gl.UNSIGNED_BYTE, this.worldRevealedData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  async onEnter() {
    const floorGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.cartoonGrass);

    const floorTwoGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.wood)
        .translate_(0, 0, this.areaWorldSize);

    const floorThreeGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.jackolanternFace)
        .translate_(0, 0, this.areaWorldSize * 2);

    const floorFourGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.cartoonGrass)
        .translate_(0, 0, this.areaWorldSize * 3);

    const floorFiveGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.wood)
        .translate_(0, 0, this.areaWorldSize * 4);

    const floorSixGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.cartoonGrass)
        .translate_(0, 0, this.areaWorldSize * 5);

    const floorSevenGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 1, 1, 1, 1)
        .texturePerSide(materials.jackolanternFace)
        .translate_(0, 0, this.areaWorldSize * 6);

    // TODO: Remove passing octree and hardcode sizes in final game
    // await makeGrassMountainRegion(floorGeo, this.octree);
    // await makeGrassMountainRegion(floorTwoGeo, this.octree);

    floorGeo.merge(floorTwoGeo).merge(floorThreeGeo).merge(floorFourGeo).merge(floorFiveGeo).merge(floorSixGeo).merge(floorSevenGeo).translate_(0, 0, this.areaBaseOffset);

    const floor = new Mesh(floorGeo.spreadTextureCoords(90, 90).translate_(0, -50).computeNormals().done_(), materials.cartoonGrass);
    // make this better later
    this.octree.bounds.min.y -= 50;

    this.scene.add_(this.player.mesh, floor, makeWorld());
    const faces = meshToFaces([floor, makeWorld()]);

    faces.forEach(face => this.octree.insert(face));
  }


  // TODO: remember to update this from the computed octree when level design finished
  octree: OctreeNode

  onUpdate() {
    this.player.update(this.octree);

    gl.activeTexture(gl.TEXTURE3);

    const areaSpace = clamp(this.player.collisionSphere.center.z / this.areaWorldSize, 0, 6);
    const areaIndex = Math.floor(areaSpace);
    const transitionPercent = areaSpace - areaIndex;
    const nextAreaIndex = clamp(transitionPercent >= 0.5 ? (areaIndex + 1) : areaIndex - 1, 0, 6);

    tmpl.innerHTML = `${areaIndex} -> ${nextAreaIndex}`;

    // tmpl.innerHTML = `First Area: ${Math.round(this.areas[0].filledCount / this.areaTextureArea * 100)}%  ---- Second Area: ${Math.round(this.areas[1].filledCount / this.areaTextureArea * 100)}`;

    // if (areaSpace)

    textureLoader.fromSkybox = areaIndex;
    textureLoader.toSkybox = nextAreaIndex;


    if (nextAreaIndex < areaIndex && transitionPercent < 0.15) {
      textureLoader.toBlend = inverseLerp(.1, 0, transitionPercent) * .5;
    } else if (nextAreaIndex > areaIndex && transitionPercent > 0.85) {
      textureLoader.toBlend = inverseLerp(.9, 1, transitionPercent) * .5;
    } else {
      textureLoader.toBlend = 0;
    }

    // tmpl.innerHTML = `Tran: ${transitionPercent}  -  from: ${areaIndex}  -  to: ${nextAreaIndex}  -  blend: ${blend}`;


    // if (transitionPercent < .15 && previousArea) {
    //   from = previousArea;
    //   to = currentArea;
    //   blend = smoothstep(0, .15, t);
    // }
    // else if (t > .85 && nextArea) {
    //   from = currentArea;
    //   to = nextArea;
    //   blend = smoothstep(.85, 1, t);
    // }
    // else {
    //   from = to = currentArea;
    //   blend = 0;
    // }


    const radius = 4;

    if (this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas[areaIndex])) {
      this.revealAt(areaIndex, this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius);
    }

    if (nextAreaIndex !== areaIndex && this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas[nextAreaIndex])) {
      // tmpl.innerHTML += '-- HITTING NEXT!';
      this.revealAt(nextAreaIndex, this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius);
    }

    this.scene.updateWorldMatrix();
    render(this.player.camera, this.scene, this.player);
  }

  private revealAt(areaIndex: number, worldX: number, worldZ: number, radius: number) {
    const area = this.areas[areaIndex];

    const pixelX = Math.floor((worldX + this.areaBaseOffset) / this.areaWorldSize * this.areaTextureSize);

    const pixelY = Math.floor(
        (worldZ - area.startWorldZ) / this.areaWorldSize * this.areaTextureSize
    );

    let isDirty = false;

    for (let dy = -radius; dy <= radius; ++dy) {
      for (let dx = -radius; dx <= radius; ++dx) {
        if (dx * dx + dy * dy > radius * radius) continue;

        const px = pixelX + dx;
        const py = pixelY + dy;

        if (
            px >= 0 && px < this.areaTextureSize &&
            py >= 0 && py < this.areaTextureSize
        ) {
          const index = py * this.areaTextureSize + px;
          if (area.data[index] === 0) {
            area.data[index] = 255;
            area.filledCount++;
            isDirty = true;
          }
        }
      }
    }

    if (isDirty) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, areaIndex * this.areaTextureSize, this.areaTextureSize, this.areaTextureSize, gl.RED, gl.UNSIGNED_BYTE, this.areas[areaIndex].data);
    }
  }

  private circleIntersectsArea(x: number, z: number, radius: number, area: WorldArea) {
    const worldRadius = radius / this.areaTextureSize * this.areaWorldSize;
    const halfSize = this.areaWorldSize / 2;

    const closestX = Math.max(-halfSize, Math.min(x, halfSize));
    const closestZ = Math.max(area.startWorldZ, Math.min(z, area.startWorldZ + this.areaWorldSize));

    const dx = x - closestX;
    const dz = z - closestZ;

    return dx * dx + dz * dz <= worldRadius * worldRadius;
  }
}
