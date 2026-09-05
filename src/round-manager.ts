import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";
import {Mesh} from "@/engine/renderer/mesh";
import {Sphere} from "@/engine/physics/aabb";
import {Scene} from "@/engine/renderer/scene";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {materials} from "@/textures";
import {ThirdPersonPlayer} from "@/core/third-person-player";

export class RoundManager {
    rounds: BeaconCrystal[][];
    currentRound = -1;
    sceneRef: Scene;

    constructor(sceneRef: Scene) {
        this.sceneRef = sceneRef;

        this.rounds = [
            // round 0
            [
                // red area
                new BeaconCrystal(-65, 42, 160),
                new BeaconCrystal(-122, 60, 260),

                // yellow area
                new BeaconCrystal(-71, 44, 383),
                new BeaconCrystal(-125, 30, 563),

                // green area
                new BeaconCrystal(-62, 38, 683),
                new  BeaconCrystal(-15, 37, 884),

                // blue area
                new BeaconCrystal(86, 45, 935),
                new BeaconCrystal(91, 37, 1150),

                // purple area
                new BeaconCrystal(131, 45, 1282),
                new BeaconCrystal(23, 37, 1379),
            ],

            // round 1
            [
                // red area
                new BeaconCrystal(46, 65, 236),
                new BeaconCrystal(-10, 77, 95),

                // yellow area
                new BeaconCrystal(110, 60, 587),
                new BeaconCrystal(118, 57, 370),

                // green area
                new BeaconCrystal(133, 47, 766),
                new BeaconCrystal(73, 55, 645),


                // blue area
                new BeaconCrystal(12, 52, 1100),
                new BeaconCrystal(132, 68, 1036),


                // purple area
                new BeaconCrystal(-104, 55, 1296),
                new BeaconCrystal(-22, 43, 1230),
            ],

            // round 2
            [
                // red area
                new BeaconCrystal(-93, 93, 94),

            ]
        ];
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

            if (crystal.collisionDistance.dot(crystal.collisionDistance) < 80) { // enemy radius + player radius squared
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
        this.mesh = new Mesh(new MoldableCubeGeometry(4, 8, 4, 2, 2, 2)
            .selectBy(vert => Math.abs(vert.y) >= 4)
            .scale_(0, 1, 0)
            .invertSelection()
            .translate_(0, 2)
            .spreadTextureCoords(12, 8, 0, 0.5)
            .texturePerSide(materials.rainbowCrystal)
            .merge(
                new MoldableCubeGeometry(3, 150, 3, 3, 1, 3)
                    .cylindrify(2)
                    // .spreadTextureCoords(, 4)
                    .translate_(0, 77)
                    .texturePerSide(materials.rainbowTransparent)
            ).done_(), materials.rainbow);



        // this.mesh = new Mesh(new MoldableCubeGeometry(3, 3, 3, 2, 1, 2).newCapsulify(3).scale_(1, 2).spreadTextureCoords(10, 10).texturePerSide(materials.rainbowCrystal)
        //     .merge(new MoldableCubeGeometry(3, 60, 3, 3, 1, 3).cylindrify(2).spreadTextureCoords(4, 4).translate_(0, 35).texturePerSide(materials.rainbowTransparent)).done_(), materials.rainbowCrystal);
        this.mesh.position_.set(x, y, z);
        this.collisionSphere = new Sphere(this.mesh.position_.clone_(), 3);
        // this.collisionSphere.center.y += 2; // check this
    }
}
