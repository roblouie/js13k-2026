import {State} from '@/core/state';
import {Scene} from '@/engine/renderer/scene';
import {Camera} from '@/engine/renderer/camera';
import {meshToFaces} from '@/engine/physics/parse-faces';
import {render} from '@/engine/renderer/renderer';
import {OctreeNode} from "@/engine/physics/octree";
import {ThirdPersonPlayer} from "@/core/third-person-player";

import {gl} from "@/engine/renderer/lil-gl";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import { materials} from "@/textures";
import {Mesh} from "@/engine/renderer/mesh";
import {clamp, inverseLerp} from "@/engine/helpers";
import {textureLoader} from "@/engine/renderer/texture-loader";
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
import {
  playChime,
  playEncodedSong, playGlassBreak,
  playSong,
  playSparkle,
  playWoosh,
  scheduleLoop
} from "@/sounds/test-encode-decode";
import {audioContext} from "@/engine/audio/audio-helpers";
import {jumpSound} from "@/sounds/jump-sound";

type WorldArea = { startWorldZ: number, data: Uint8Array, filledCount: number, startTexture: Material, creationFunc: (geo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) => Promise<void>, uiElement: HTMLDivElement, heights: number[] };

export class GameState implements State {
  player: ThirdPersonPlayer;
  scene: Scene;

  private timeLeft = 300;

  private areaTextureSize = 128;
  private areaTextureArea = this.areaTextureSize * this.areaTextureSize;
  private areaWorldSize = 300;
  private areaBaseOffset = 150;
  private worldSpaceConverter = this.areaWorldSize / this.areaTextureSize;
  private worldRevealTextureSize = { width: 128, height: 640 };
  private worldRevealedData = new Uint8Array(this.worldRevealTextureSize.width * this.worldRevealTextureSize.height);

  private roundManager: RoundManager;

  private areas_: WorldArea[] = [
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

    // for (let i = 0; i < this.worldRevealedData.length; i++) {
    //   this.worldRevealedData[i] = 0xff;
    // }

    const worldRevealTexture = gl.createTexture();
    gl.activeTexture(33987);
    gl.bindTexture(3553, worldRevealTexture);
    gl.texImage2D(3553, 0, 33321, this.worldRevealTextureSize.width, this.worldRevealTextureSize.height, 0, 6403, 5121, this.worldRevealedData);
    gl.texParameteri(3553, 10241, 9729);
  }

  async onEnter() {
    const floorGeo = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 63, 1, 63, 1)
        .texturePerSide(this.areas_[0].startTexture).spreadTextureCoords(30, 30);

    await this.areas_[0].creationFunc(floorGeo, this.octree, this.areas_[0].heights);

    for (let i = 1; i < 5; i++) {
      const area = new MoldableCubeGeometry(this.areaWorldSize, 1, this.areaWorldSize, 63, 1, 63, 1)
          .texturePerSide(this.areas_[i].startTexture).spreadTextureCoords(30, 30);

      await this.areas_[i].creationFunc(area, this.octree, this.areas_[i].heights);

      floorGeo.merge(area.translate_(0, 0, this.areaWorldSize * i));
    }



    // TODO: Remove passing octree and hardcode sizes in final game
    // await makeGrassMountainRegion(floorGeo, this.octree);
    // await makeGrassMountainRegion(floorTwoGeo, this.octree);

    floorGeo.translate_(0, 0, this.areaBaseOffset);

    const floor = new Mesh(floorGeo.computeNormals().done_(), materials.cartoonGrass);
    // make this better later
    // this.octree.bounds_.min.y -= 50;

    this.scene.add_(this.player.mesh, floor);
    this.roundManager.roundChange();
    const faces = meshToFaces([floor]);

    faces.forEach(face => this.octree.insert(face));


    let isStarted = false;

    tmpl.addEventListener('click', () => {
      if (!isStarted) {

        isStarted = true;
      }
    })

  }


  // TODO: remember to update this from the computed octree when level design finished
  octree: OctreeNode

  onUpdate() {
    this.player.update(this.octree);
    this.roundManager.update(this.player);

    gl.activeTexture(33987);

    const areaSpace = this.player.collisionSphere.center.z / this.areaWorldSize;
    let areaIndex = Math.floor(areaSpace);
    const transitionPercent = areaSpace - areaIndex;
    let nextAreaIndex = transitionPercent >= 0.5 ? (areaIndex + 1) : areaIndex - 1;

    // tmpl.innerHTML = `${areaIndex} -> ${nextAreaIndex}`;

    // tmpl.innerHTML = `First Area: ${Math.round(this.areas[0].filledCount / this.areaTextureArea * 100)}%  ---- Second Area: ${Math.round(this.areas[1].filledCount / this.areaTextureArea * 100)}`;

    // if (areaSpace)

    areaIndex = clamp(areaIndex, 0, this.areas_.length - 1);
    nextAreaIndex = clamp(nextAreaIndex, 0, this.areas_.length - 1);

    textureLoader.fromSkybox = this.roundManager.areaSkyboxUnlocks[areaIndex] ? areaIndex : 7;
    textureLoader.toSkybox = this.roundManager.areaSkyboxUnlocks[nextAreaIndex] ? nextAreaIndex : 7;

    if (nextAreaIndex < areaIndex && transitionPercent < 0.1) {
      textureLoader.toBlend = inverseLerp(.1, 0, transitionPercent) * .5;
    } else if (nextAreaIndex > areaIndex && transitionPercent > 0.9) {
      textureLoader.toBlend = inverseLerp(.9, 1, transitionPercent) * .5;
    } else {
      textureLoader.toBlend = 0;
    }




    const radius = 4;

    if (this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas_[areaIndex])) {
      this.revealAt(areaIndex, this.player.collisionSphere.center, radius);
    }

    if (nextAreaIndex !== areaIndex && this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas_[nextAreaIndex])) {
      this.revealAt(nextAreaIndex, this.player.collisionSphere.center, radius);
    }

    this.areas_.forEach(area => {
      const percent = Math.round(area.filledCount / this.areaTextureArea * 100);
      area.uiElement.dataset.p = percent + '%';
      area.uiElement.style.width = percent + '%';
    });

    this.timeLeft -= .0166;
    timer.textContent = Math.max(Math.round(this.timeLeft), 0);

    this.scene.updateWorldMatrix();
    render(this.player.camera, this.scene, this.player);

  }

  private currentParticleTextureId = materials.witchClothes.texture.id + 1;

  private revealAt(areaIndex: number, worldPosition: EnhancedDOMPoint, radius: number) {
    const area = this.areas_[areaIndex];

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
              position_: this.getFloorPosition(worldPosition.x + dx * this.worldSpaceConverter, worldPosition.z + dy * this.worldSpaceConverter, area),
              size_: 70 + Math.random() * 30,
              sizeModifier: -1,
              textureId: this.currentParticleTextureId,
              velocity: new EnhancedDOMPoint(0, Math.random() * 0.4, 0),
            });

            this.currentParticleTextureId++;
            if (this.currentParticleTextureId > materials.witchClothes.texture.id + 8) {
              this.currentParticleTextureId = materials.witchClothes.texture.id + 1;
            }

            isDirty = true;
          }
        }
      }
    }

    if (isDirty) {
      // playPop(1000 + Math.random() * 200);
      // playWoosh(audioContext.currentTime, 0.1, 0.1);
      // playChime(audioContext.currentTime, 0.1, 1500 + Math.random() * 300);
      // playSparkle(audioContext.currentTime, 0.1, 2000 + this.audioCount * 100 + Math.random() * 100);
      // playPop(1600 + Math.random() * 400);
      playGlassBreak(audioContext.currentTime, 0.1, true);
      gl.texSubImage2D(3553, 0, 0, areaIndex * this.areaTextureSize, this.areaTextureSize, this.areaTextureSize, 6403, 5121, this.areas_[areaIndex].data);
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
