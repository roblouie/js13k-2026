import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";
import {Mesh} from "@/engine/renderer/mesh";
import {Sphere} from "@/engine/physics/aabb";
import {Scene} from "@/engine/renderer/scene";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {materials} from "@/textures";
import {ThirdPersonPlayer} from "@/core/third-person-player";

export class RoundManager {
    rounds: BeaconCrystal[][];
    currentRound = 0;
    sceneRef: Scene;

    constructor(sceneRef: Scene) {
        this.sceneRef = sceneRef;

        this.rounds = [
            // round 0
            [
                // red area
                new BeaconCrystal(10, 40, 210), new BeaconCrystal(100, 120, 130),

                // yellow area
            ]
        ];

        this.sceneRef.add_(...this.rounds[this.currentRound].map(round => round.mesh));
    }

    roundChange() {
        if (this.currentRound < 4) {
            this.currentRound++;
        }

        this.sceneRef.add_(...this.rounds[this.currentRound].map(round => round.mesh));
    }

    update(player: ThirdPersonPlayer) {
        this.rounds[this.currentRound].forEach(crystal => {
            crystal.collisionDistance.subtractVectors(player.collisionSphere.center, crystal.collisionSphere.center);

            if (crystal.collisionDistance.dot(crystal.collisionDistance) < 25) { // enemy radius + player radius squared
                this.sceneRef.remove_(crystal.mesh);
                this.rounds[this.currentRound] = this.rounds[this.currentRound].filter(toRemove => crystal !== toRemove);
            }
        });

        if (this.rounds[this.currentRound].length === 0) {
            this.roundChange();
        }
    }

}

class BeaconCrystal {
    mesh: Mesh;
    collisionSphere: Sphere;
    collisionDistance = new EnhancedDOMPoint();

    constructor(x: number, y: number, z: number) {
        this.mesh = new Mesh(new MoldableCubeGeometry(3, 3, 3, 2, 1, 2).newCapsulify(3).scale_(1, 2).spreadTextureCoords(10, 10).texturePerSide(materials.rainbowCrystal)
            .merge(new MoldableCubeGeometry(3, 60, 3, 3, 1, 3).cylindrify(2).spreadTextureCoords(4, 4).translate_(0, 35).texturePerSide(materials.rainbowTransparent)).done_(), materials.rainbowCrystal);
        this.mesh.position.set(x, y, z);
        this.collisionSphere = new Sphere(this.mesh.position.clone_(), 3);
        // this.collisionSphere.center.y += 2; // check this
    }
}
