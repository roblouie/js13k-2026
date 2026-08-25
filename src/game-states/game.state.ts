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
import {clamp} from "@/engine/helpers";

type WorldArea = { startWorldZ: number, data: Uint8Array, filledCount: number };

export class GameState implements State {
  player: ThirdPersonPlayer;
  scene: Scene;

  private areaTextureSize = 128;
  private areaTextureArea = this.areaTextureSize * this.areaTextureSize;
  private areaWorldSize = 300;
  private areaBaseOffset = this.areaWorldSize / 2;
  private worldRevealTextureSize = { width: 128, height: 256};
  private worldRevealedData = new Uint8Array(this.worldRevealTextureSize.width * this.worldRevealTextureSize.height);

  private areas: WorldArea[] = [
    {
      startWorldZ: -this.areaBaseOffset,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, 0, this.areaTextureArea),
    },
    {
      startWorldZ: -this.areaBaseOffset + this.areaWorldSize,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea, this.areaTextureArea)
    },
  ];

  constructor() {
    this.scene = new Scene();
    console.log(this.areaBaseOffset)
    //this.player = new FreeCam(new Camera(Math.PI / 3, 16 / 9, 1, 500));

    this.player = new ThirdPersonPlayer(new Camera(Math.PI / 2.5, 16 / 9, 1, 700));

    this.octree = new OctreeNode({
      max: {x: 256, y: 0, z: 256 + 512, w: 1},
      min: { x: -256, y: 0, z: -256 }
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
    const floorGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 63, 1, 63, 1)
        .texturePerSide(materials.cartoonGrass);

    const floorTwoGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 63, 1, 63, 1)
        .texturePerSide(materials.wood)
        .translate_(0, 0, this.areaWorldSize)

    // TODO: Remove passing octree and hardcode sizes in final game
    await makeGrassMountainRegion(floorGeo, this.octree);
    await makeGrassMountainRegion(floorTwoGeo, this.octree);

    floorGeo.merge(floorTwoGeo);

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

    const areaSpace = clamp((this.player.collisionSphere.center.z + this.areaBaseOffset) / this.areaWorldSize, 0, 6);
    const areaIndex = Math.floor(areaSpace);
    const nextAreaIndex = clamp(Math.round(areaSpace) > areaIndex ? (areaIndex + 1) : areaIndex - 1, 0, 6);

    // tmpl.innerHTML = `First Area: ${Math.round(this.areas[0].filledCount / this.areaTextureArea * 100)}%  ---- Second Area: ${Math.round(this.areas[1].filledCount / this.areaTextureArea * 100)}`;

    const r = 4;

    if (this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, r, this.areas[areaIndex])) {
      this.revealAt(areaIndex, this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, r);
    }

    if (nextAreaIndex !== areaIndex && this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, r, this.areas[nextAreaIndex])) {
      this.revealAt(nextAreaIndex, this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, r);
    }

    this.scene.updateWorldMatrix();
    render(this.player.camera, this.scene, this.player, this.worldRevealedData);
  }

  private revealAt(areaIndex: number, worldX: number, worldZ: number, radius: number) {
    const area = this.areas[areaIndex];

    const pixelX = Math.floor((worldX + this.areaBaseOffset) / this.areaWorldSize * this.areaTextureSize);

    const pixelY = Math.floor(
        (worldZ - area.startWorldZ) / this.areaWorldSize * this.areaTextureSize
    );

    tmpl.innerHTML = pixelX;

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
    const closestX = Math.max(-this.areaWorldSize, Math.min(x, this.areaWorldSize));
    const closestZ = Math.max(area.startWorldZ, Math.min(z, area.startWorldZ + this.areaWorldSize));

    const dx = x - closestX;
    const dz = z - closestZ;

    return dx * dx + dz * dz <= radius * radius;
  }
}
