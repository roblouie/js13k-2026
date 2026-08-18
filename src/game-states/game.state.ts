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

export class GameState implements State {
  player: ThirdPersonPlayer;
  scene: Scene;
  private worldRevealDataSize = 128;
  worldRevealedData = new Uint8Array(128 * 128);

  constructor() {
    this.scene = new Scene();
    //this.player = new FreeCam(new Camera(Math.PI / 3, 16 / 9, 1, 500));

    this.player = new ThirdPersonPlayer(new Camera(Math.PI / 2.5, 16 / 9, 1, 700));

    this.octree = new OctreeNode({
      max: {x: 256, y: 0, z: 256, w: 1},
      min: { x: -256, y: 0, z: -256 }
    }, 0);

    for (let i = 0; i < 16384; i++) {
      this.worldRevealedData[i] = 0xff;
    }

    const worldRevealTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, worldRevealTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 128, 128, 0, gl.RED, gl.UNSIGNED_BYTE, this.worldRevealedData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  async onEnter() {
    const floorGeo = new MoldableCubeGeometry(512, 1, 512, 63, 1, 63, 1)
        .texturePerSide(materials.cartoonGrass);

    // TODO: Remove passing octree and hardcode sizes in final game
    await makeGrassMountainRegion(floorGeo, this.octree);

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
    gl.activeTexture(gl.TEXTURE3);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.worldRevealDataSize, this.worldRevealDataSize, gl.RED, gl.UNSIGNED_BYTE, this.worldRevealedData);

    this.revealAt(this.player.collisionSphere.center.x, this.player.collisionSphere.center.z);
    this.player.update(this.octree);
    this.scene.updateWorldMatrix();
    render(this.player.camera, this.scene, this.player, this.worldRevealedData);
  }

  private revealAt(worldX: number, worldZ: number) {
    // the "magic numbers" 536 and 524 come from taking the octree min/max for a given direction and getting the span between them
    const x = Math.floor((worldX - this.octree.bounds.min.x) / 512 * this.worldRevealDataSize);
    const y = Math.floor((worldZ - this.octree.bounds.min.z) / 512 * this.worldRevealDataSize);

    const r = 2;

    for (let dy = -r; dy <= r; ++dy) {
      for (let dx = -r; dx <= r; ++dx) {
        if (dx * dx + dy * dy > r * r) continue;

        const px = x + dx;
        const py = y + dy;

        if (px >= 0 && px < this.worldRevealDataSize && py >= 0 && py < this.worldRevealDataSize)
          this.worldRevealedData[py * this.worldRevealDataSize + px] = 255;
      }
    }
  }
}
