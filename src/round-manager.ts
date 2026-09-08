import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";
import {Mesh} from "@/engine/renderer/mesh";
import {Sphere} from "@/engine/physics/aabb";
import {Scene} from "@/engine/renderer/scene";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {Materials, materials} from "@/textures";
import {ThirdPersonPlayer} from "@/core/third-person-player";
import {musicTrackStates, playGlassBreak, playSong} from "@/sounds/test-encode-decode";
import {audioContext} from "@/engine/audio/audio-helpers";
import {particles, randomNegativeOneOne} from "@/engine/particles";

export const enum RoundCheckState {
    None,
    CrystalHit,
    GameEnd,
}

export class RoundManager {
    rounds: BeaconCrystal[][] = [];
    currentRound = -1;
    sceneRef: Scene;

    areaSkyboxUnlocks: boolean[] = [];

    constructor(sceneRef: Scene) {
        this.sceneRef = sceneRef;
        this.reset();
    }

    reset() {
        this.currentRound = -1;
        this.areaSkyboxUnlocks = [false, false, false, false, false];
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
                new BeaconCrystal(46, 65, 236, 0),
                new BeaconCrystal(-10, 77, 95, 0),

                // yellow area
                new BeaconCrystal(110, 60, 587, 1),
                new BeaconCrystal(118, 57, 370, 1),

                // green area
                new BeaconCrystal(133, 47, 766, 2),
                new BeaconCrystal(73, 55, 645, 2),


                // blue area
                new BeaconCrystal(12, 52, 1100, 3),
                new BeaconCrystal(132, 68, 1036, 3),


                // purple area
                new BeaconCrystal(-104, 55, 1296, 4),
                new BeaconCrystal(-22, 43, 1230, 4),
            ],

            // round 2
            [
                // red area
                new BeaconCrystal(-93, 93, 94),

            ]
        ];
    }

    roundChange() {
        if (this.currentRound < this.rounds.length - 1) {
            this.currentRound++;
        }

        this.sceneRef.add_(...this.rounds[this.currentRound].map(round => round.mesh));
    }

    private currentParticleTextureId = Materials.star0;

    private fireParticles(position: EnhancedDOMPoint, baseSize: number, baseYMomentum = 0.5) {
        for (let i = 0; i < 15; i++) {
            particles.push({
                isAffectedByGravity: true,
                life: 3,
                lifeModifier: 0.02,
                position_: position.clone_(),
                size_: baseSize + Math.random() * 30,
                sizeModifier: 0.5,
                textureId: this.currentParticleTextureId,
                velocity: new EnhancedDOMPoint(randomNegativeOneOne(), baseYMomentum + Math.random() * 0.3, randomNegativeOneOne()),
            });

            this.currentParticleTextureId++;
            if (this.currentParticleTextureId > Materials.star7) {
                this.currentParticleTextureId = Materials.star0;
            }
        }
    }

    update(player: ThirdPersonPlayer): RoundCheckState {
        const currentRoundData = this.rounds[this.currentRound];
        let checkState = RoundCheckState.None;

        if (!currentRoundData) {
            return checkState;
        }

        currentRoundData.forEach(crystal => {
            crystal.collisionDistance.subtractVectors(player.collisionSphere.center, crystal.collisionSphere.center);

            if (crystal.collisionDistance.dot(crystal.collisionDistance) < 80) { // enemy radius + player radius squared
                checkState = RoundCheckState.CrystalHit;
                playGlassBreak(audioContext.currentTime, 2.0);
                this.sceneRef.remove_(crystal.mesh);
                this.rounds[this.currentRound] = currentRoundData.filter(toRemove => crystal !== toRemove);


                this.fireParticles(crystal.collisionSphere.center, 150);

                // Special pickup effects
                if (this.currentRound === 0) {
                    if (currentRoundData.length === 9 && !musicTrackStates[1].enabled_) {
                        musicTrackStates[1].enabled_ = true;
                        playSong();
                    } else if (this.rounds[this.currentRound].length === 3) {
                        musicTrackStates[2].enabled_ = true;
                    }
                } else if (this.currentRound === 1) {
                    if (!this.areaSkyboxUnlocks[crystal.areaIndex]) {
                        if (!musicTrackStates[0].enabled_) {
                            musicTrackStates[0].enabled_ = true;
                        }

                        const particlePoint = player.collisionSphere.center.clone_();
                        particlePoint.y += 2;
                        this.fireParticles(particlePoint, 700, 0.75);
                        this.areaSkyboxUnlocks[crystal.areaIndex] = true;
                    }
                }
            }
        });

        if (currentRoundData.length === 0) {
            if (this.currentRound === this.rounds.length - 1) {
                checkState = RoundCheckState.GameEnd;
            }

            this.roundChange();
        }

        return checkState;
    }

}

class BeaconCrystal {
    mesh: Mesh;
    collisionSphere: Sphere;
    collisionDistance = new EnhancedDOMPoint();
    areaIndex?: number

    constructor(x: number, y: number, z: number, areaIndex?: number) {
        this.areaIndex = areaIndex;
        this.mesh = new Mesh(new MoldableCubeGeometry(4, 8, 4, 2, 2, 2)
            .selectBy(vert => Math.abs(vert.y) >= 4)
            .scale_(0, 1, 0)
            .invertSelection()
            .translate_(0, 2)
            .spreadTextureCoords(12, 8, 0, 0.5)
            .texturePerSide(Materials.rainbowCrystal)
            .merge(
                new MoldableCubeGeometry(3, 150, 3, 3, 1, 3)
                    .cylindrify(2)
                    // .spreadTextureCoords(, 4)
                    .translate_(0, 77)
                    .texturePerSide(Materials.rainbowTransparent)
            ).done_());



        // this.mesh = new Mesh(new MoldableCubeGeometry(3, 3, 3, 2, 1, 2).newCapsulify(3).scale_(1, 2).spreadTextureCoords(10, 10).texturePerSide(materials.rainbowCrystal)
        //     .merge(new MoldableCubeGeometry(3, 60, 3, 3, 1, 3).cylindrify(2).spreadTextureCoords(4, 4).translate_(0, 35).texturePerSide(materials.rainbowTransparent)).done_(), materials.rainbowCrystal);
        this.mesh.position_.set(x, y, z);
        this.collisionSphere = new Sphere(this.mesh.position_.clone_(), 3);
        // this.collisionSphere.center.y += 2; // check this
    }
}
