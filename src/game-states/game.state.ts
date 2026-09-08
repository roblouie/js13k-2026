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

type WorldArea = { startWorldZ: number, data: Uint8Array, filledCount: number, startTexture: Material, creationFunc: (geo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) => Promise<void>, heights: number[] };

export class GameState implements State {
  player: ThirdPersonPlayer;
  scene: Scene;

  private timeLeft = 300;
  private score = 0;
  private power = 0;
  private readonly maxPower = 10_000;
  private powerPercentage = 0;

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
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea, this.areaTextureArea),
      startTexture: materials.sand,
      creationFunc: makeYellowArea,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize * 2,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 2, this.areaTextureArea),
      startTexture: materials.cartoonGrass,
      creationFunc: makeGreenArea,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize * 3,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 3, this.areaTextureArea),
      startTexture: materials.blue,
      creationFunc: makeBlueArea,
      heights: [],
    },
    {
      startWorldZ: this.areaWorldSize * 4,
      filledCount: 0,
      data: new Uint8Array(this.worldRevealedData.buffer, this.areaTextureArea * 4, this.areaTextureArea),
      startTexture: materials.purple,
      creationFunc: makePurpleArea,
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

    floorGeo.translate_(0, 0, this.areaBaseOffset);

    const floor = new Mesh(floorGeo.computeNormals().done_(), materials.cartoonGrass);

    this.scene.add_(this.player.mesh, floor);
    this.roundManager.roundChange();
    const faces = meshToFaces([floor]);

    faces.forEach(face => this.octree.insert(face));
  }


  // TODO: remember to update this from the computed octree when level design finished
  octree: OctreeNode

  private hasMetDecreaseThreshold = false;

  onUpdate() {
    if (!this.hasMetDecreaseThreshold) {
      if (this.power >= 150) {
        this.hasMetDecreaseThreshold = true;
      }
    }

    if (this.hasMetDecreaseThreshold) {
      this.power -= 1;
    }

    this.player.update(this.octree);
    if (this.roundManager.update(this.player)) {
      this.power += 200;
    }

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




    const radius = this.getPlayerColorRadius();

    if (this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas_[areaIndex])) {
      this.revealAt(areaIndex, this.player.collisionSphere.center, radius);
    }

    if (nextAreaIndex !== areaIndex && this.circleIntersectsArea(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z, radius, this.areas_[nextAreaIndex])) {
      this.revealAt(nextAreaIndex, this.player.collisionSphere.center, radius);
    }

    this.areas_.forEach(area => {
      const percent = Math.round(area.filledCount / (this.areaTextureArea - 100) * 100); // 100 pixel count buffer for pixels at the edges of the world
      // TODO: show UI updates with score bonuses when percentages filled in
    });

    this.scene.updateWorldMatrix();
    render(this.player.camera, this.scene, this.player);

    // Update power
    this.power = clamp(this.power, 0, this.maxPower + 700);
    this.powerPercentage = this.power / this.maxPower;
    pwr.style.height = Math.min(this.powerPercentage * 100, 100) + '%';
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
            this.score += this.getScoreMultiplier();
            this.power+= 0.7;

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
      score.textContent = 'SCORE ' + this.score;
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

  private getScoreMultiplier(): number {
    if (this.powerPercentage >= 0.8) {
      scmul.innerHTML = 'SCORE &#215;4';
      return 4;
    } else if (this.powerPercentage >= 0.6) {
      scmul.innerHTML = 'SCORE &#215;3';
      return 3;
    } else if (this.powerPercentage >= 0.2) {
      scmul.innerHTML = 'SCORE &#215;2';
      return 2;
    }

    scmul.innerHTML = '';
    return 1;
  }

  private getPlayerColorRadius(): number {
    if (this.powerPercentage >= 1) {
      radpls.innerHTML = 'RADIUS ++';
      return 16;
    } else if (this.powerPercentage >= 0.4) {
      radpls.innerHTML = 'RADIUS +';
      return 8;
    }

    radpls.innerHTML = '';
    return 4;
  }
}
