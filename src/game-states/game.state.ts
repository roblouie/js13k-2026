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
import {clamp, inverseLerp, smoothstep} from "@/engine/helpers";
import {textureLoader} from "@/engine/renderer/texture-loader";
import {Texture} from "@/engine/renderer/texture";
import {Material} from "@/engine/renderer/material";
import {
  makeBlueArea,
  makeGreenArea,
  makePurpleArea,
  makeRedArea,
  makeYellowArea
} from "@/modeling/environments";
import {particles} from "@/engine/particles";
import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";
import {RoundManager} from "@/round-manager";

type WorldArea = { startWorldZ: number, data: Uint8Array, filledCount: number, startTexture: Material, creationFunc: (geo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) => Promise<void>, uiElement: HTMLDivElement, heights: number[] };

export class GameState implements State {
  player: ThirdPersonPlayer;
  scene: Scene;

  private timeLeft = 300;

  private areaTextureSize = 128;
  private areaTextureArea = this.areaTextureSize * this.areaTextureSize;
  private areaWorldSize = 300;
  private areaBaseOffset = this.areaWorldSize / 2;
  private worldSpaceConverter = this.areaWorldSize / this.areaTextureSize;
  private worldRevealTextureSize = { width: 128, height: 640 };
  private worldRevealedData = new Uint8Array(this.worldRevealTextureSize.width * this.worldRevealTextureSize.height);

  private roundManager: RoundManager;

  private areas: WorldArea[] = [
    {
      startWorldZ: 0,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, 0, this.areaTextureArea),
      startTexture: materials.red,
      creationFunc: makeRedArea,
      uiElement: uir,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea, this.areaTextureArea),
      startTexture: materials.sand,
      creationFunc: makeYellowArea,
      uiElement: uiy,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize * 2,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 2, this.areaTextureArea),
      startTexture: materials.cartoonGrass,
      creationFunc: makeGreenArea,
      uiElement: uig,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize * 3,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 3, this.areaTextureArea),
      startTexture: materials.blue,
      creationFunc: makeBlueArea,
      uiElement: uib,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize * 4,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 4, this.areaTextureArea),
      startTexture: materials.purple,
      creationFunc: makePurpleArea,
      uiElement: uip,
      heights: [],
    },
  ];

  constructor() {
    this.scene = new Scene();
    this.roundManager = new RoundManager(this.scene);
    //this.player = new FreeCam(new Camera(Math.PI / 3, 16 / 9, 1, 500));

    this.player = new ThirdPersonPlayer(new Camera(Math.PI / 2.5, 16 / 9, 1, 700));

    this.octree = new OctreeNode({
      max: {x: 150, y: 0, z: 1500, w: 1},
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
    const floorGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 63, 1, 63, 1)
        .texturePerSide(this.areas[0].startTexture).spreadTextureCoords(90, 90);

    await this.areas[0].creationFunc(floorGeo, this.octree, this.areas[0].heights);

    for (let i = 1; i < 5; i++) {
      const area = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 63, 1, 63, 1)
          .texturePerSide(this.areas[i].startTexture).spreadTextureCoords(90, 90);

      await this.areas[i].creationFunc(area, this.octree, this.areas[i].heights);

      floorGeo.merge(area.translate_(0, 0, this.areaWorldSize * i));
    }



    // TODO: Remove passing octree and hardcode sizes in final game
    // await makeGrassMountainRegion(floorGeo, this.octree);
    // await makeGrassMountainRegion(floorTwoGeo, this.octree);

    floorGeo.translate_(0, 0, this.areaBaseOffset);

    const floor = new Mesh(floorGeo.computeNormals().done_(), materials.cartoonGrass);
    // make this better later
    // this.octree.bounds_.min.y -= 50;

    this.scene.add_(this.player.mesh, floor, makeWorld());
    this.roundManager.roundChange();
    const faces = meshToFaces([floor, makeWorld()]);

    faces.forEach(face => this.octree.insert(face));
  }


  // TODO: remember to update this from the computed octree when level design finished
  octree: OctreeNode

  onUpdate() {
    this.player.update(this.octree);
    this.roundManager.update(this.player);

    gl.activeTexture(gl.TEXTURE3);

    const areaSpace = this.player.collisionSphere.center.z / this.areaWorldSize;
    let areaIndex = Math.floor(areaSpace);
    const transitionPercent = areaSpace - areaIndex;
    let nextAreaIndex = transitionPercent >= 0.5 ? (areaIndex + 1) : areaIndex - 1;

    // tmpl.innerHTML = `${areaIndex} -> ${nextAreaIndex}`;

    // tmpl.innerHTML = `First Area: ${Math.round(this.areas[0].filledCount / this.areaTextureArea * 100)}%  ---- Second Area: ${Math.round(this.areas[1].filledCount / this.areaTextureArea * 100)}`;

    // if (areaSpace)

    textureLoader.fromSkybox = areaIndex;
    textureLoader.toSkybox = nextAreaIndex;

    if (nextAreaIndex < areaIndex && transitionPercent < 0.1) {
      textureLoader.toBlend = inverseLerp(.1, 0, transitionPercent) * .5;
    } else if (nextAreaIndex > areaIndex && transitionPercent > 0.9) {
      textureLoader.toBlend = inverseLerp(.9, 1, transitionPercent) * .5;
    } else {
      textureLoader.toBlend = 0;
    }

    areaIndex = clamp(areaIndex, 0, this.areas.length - 1);
    nextAreaIndex = clamp(nextAreaIndex, 0, this.areas.length - 1);


    const radius = 4;

    if (this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas[areaIndex])) {
      this.revealAt(areaIndex, this.player.collisionSphere.center, radius);
    }

    if (nextAreaIndex !== areaIndex && this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas[nextAreaIndex])) {
      this.revealAt(nextAreaIndex, this.player.collisionSphere.center, radius);
    }

    this.areas.forEach(area => {
      const percent = Math.round(area.filledCount / this.areaTextureArea * 100);
      area.uiElement.dataset.p = percent + '%';
      area.uiElement.style.width = percent + '%';
    });

    this.timeLeft -= .0166;
    timer.textContent = Math.max(Math.round(this.timeLeft), 0);

    this.scene.updateWorldMatrix();
    render(this.player.camera, this.scene, this.player);

  }

  private currentParticleTextureId = materials.s0.texture.id;

  private revealAt(areaIndex: number, worldPosition: EnhancedDOMPoint, radius: number) {
    const area = this.areas[areaIndex];

    const pixelX = Math.floor((worldPosition.x + this.areaBaseOffset) / this.areaWorldSize * this.areaTextureSize);

    const pixelY = Math.floor(
        (worldPosition.z - area.startWorldZ) / this.areaWorldSize * this.areaTextureSize
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

            particles.push({
              isAffectedByGravity: false,
              life: 0.8,
              lifeModifier: 0.02,
              position: this.getFloorPosition(worldPosition.x + dx * this.worldSpaceConverter, worldPosition.z + dy * this.worldSpaceConverter, area),
              size: 70 + Math.random() * 30,
              sizeModifier: -1,
              textureId: this.currentParticleTextureId,
              velocity: new EnhancedDOMPoint(0, Math.random() * 0.4, 0),
            });

            this.currentParticleTextureId++;
            if (this.currentParticleTextureId > materials.s0.texture.id + 7) {
              this.currentParticleTextureId = materials.s0.texture.id;
            }

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

  private getFloorPosition(posX: number, posZ: number, area: WorldArea): EnhancedDOMPoint {
    const gx = (posX - -150) / 300 * 63;
    const gz = (posZ - area.startWorldZ) / 300 * 63;

    const x = Math.floor(gx);
    const z = Math.floor(gz);

    const y = area.heights[z * (63 + 1) + x];

    return new EnhancedDOMPoint(posX, y, posZ);
  }
}
