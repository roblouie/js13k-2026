import { Camera } from '@/engine/renderer/camera';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';
import { Face } from '@/engine/physics/face';
import { findWallCollisionsFromList } from '@/engine/physics/surface-collision';
import {clamp, radsToDegrees} from '@/engine/helpers';
import {OctreeNode, querySphere} from "@/engine/physics/octree";
import {controls} from "@/core/controls";
import {Object3d} from "@/engine/renderer/object-3d";
import {Sphere} from "@/engine/physics/aabb";
import {Mesh} from "@/engine/renderer/mesh";
import {jumpSound} from "@/sounds/jump-sound";
import {audioContext} from "@/engine/audio/audio-helpers";
import {makeHorse} from "@/modeling/horse";

export class ThirdPersonPlayer {
  health = 9;
  isJumping = false;
  isGroundedThisFrame = false;
  isGrounded = false;
  wasGrounded = false;
  groundedTimer = 0;
  smoothedNormal = new EnhancedDOMPoint(0, 1, 0);
  velocity = new EnhancedDOMPoint(-0.01, 0, -0.01);
  lookatTarget = new EnhancedDOMPoint();
  isTakingHit = false;

  mesh: Object3d;
  camera: Camera;

  constructor(camera: Camera) {
    this.mesh = new Object3d(makeHorse());
    this.mesh.isUsingLookAt = true;
    this.camera = camera;
    this.camera.position.set(194, 5.5, 220);
    this.lookatTarget.set(this.mesh.position);
    this.collisionSphere = new Sphere(new EnhancedDOMPoint(181, 2, 211), 2);
  }

  speed = 1;
  angle = 90;

  nearbyFaces = new Set<Face>();
  collisionSphere: Sphere;

  yaw = .94;
  pitch = .31;
  cameraSpeed = 0.04;
  maxPitch = 1.2;
  minPitch = -0.07;
  isFrozen = false;

  update(octreeNode: OctreeNode) {
    this.wasGrounded = this.isGrounded;

    if (!this.isFrozen) {
      this.updateVelocityFromControls();  // set x / z velocity based on input
    }

    this.velocity.y -= 0.017; // gravity
    this.collisionSphere.center.add_(this.velocity);  // move the player position by the velocity

    this.velocity.y = clamp(this.velocity.y, -1, 1);
    this.collideWithLevel(octreeNode); // do collision detection, if collision is found, feetCenter gets pushed out of the collision
    this.collisionSphere.center.x = clamp(this.collisionSphere.center.x, -255, 255);
    this.collisionSphere.center.z = clamp(this.collisionSphere.center.z, -255, 255);

    this.mesh.position.set(this.collisionSphere.center); // at this point, feetCenter is in the correct spot, so draw the mesh there
    this.mesh.position.y += 1; // move up by half height so mesh ends at feet position

    // tmpl.innerHTML = `${this.yaw}, ${this.pitch}, ${this.camera.position.z}<br>${this.camera.rotation_.x}, ${this.camera.rotation_.y}, ${this.camera.rotation_.z}<br>`;

    // STOP HERE IF FROZEN
    if (this.isFrozen) {
      return;
    }

    if (this.groundedTimer < 10 && !this.isJumping && controls.leftStickMagnitude > 0) {
      const mesh = this.mesh.children_[0] as Mesh;
      mesh.alpha += this.velocity.magnitude * 0.4;

      if (mesh.alpha >= 1) {
        // Play horse footstep sound here
        mesh.alpha = 0;
        mesh.frameA++;
        mesh.frameB++;

        if (mesh.frameA > 3) {
          mesh.frameA = 0;
        }

        if (mesh.frameB > 3) {
          mesh.frameB = 0;
        }
      }
    }

    const distanceToKeep = 15;

    if (controls.cameraDirection.magnitude) {
      this.yaw += controls.cameraDirection.x * -this.cameraSpeed;
      this.pitch += controls.cameraDirection.y * this.cameraSpeed;
      this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch);
    } else {
      const toCam = this.camera.position.clone_().subtract(this.mesh.position).normalize_();
      // recover spherical angles from vector
      const onGround = this.groundedTimer < 10;
      const idlePitch = Math.atan2(4, distanceToKeep); // target pitch
      this.pitch += (idlePitch - this.pitch) * 0; //(onGround ? 0 : 0.05);   // TODO: Use some sort of input timer to lerp towards ideal after x seconds wiht no camera control

      this.yaw   = Math.atan2(toCam.x, toCam.z);
    }

    const offsetX = distanceToKeep * Math.cos(this.pitch) * Math.sin(this.yaw);
    const offsetY = distanceToKeep * Math.sin(this.pitch);
    const offsetZ = distanceToKeep * Math.cos(this.pitch) * Math.cos(this.yaw);

    const desiredPosition = this.mesh.position.clone_().add_({
      x: offsetX,
      y: offsetY,
      z: offsetZ
    });

    this.camera.position.lerp(desiredPosition, 0.7);

    const toLookAt = this.mesh.position.clone_();
    toLookAt.y += 3;

    this.lookatTarget.lerp(toLookAt, 0.7);
    // this.lookatTarget.y += 2;
    this.camera.lookAt(this.lookatTarget);
    this.camera.updateWorldMatrix();

    if (!this.wasGrounded && this.isGrounded) {
      jumpSound(true);
      controls.gamepad?.vibrationActuator?.playEffect("dual-rumble", {
        startDelay: 0,
        duration: 40,
        weakMagnitude: 0,
        strongMagnitude: 0.01,
      });
    }
  }

  collideWithLevel(octreeNode: OctreeNode) {
    this.nearbyFaces.clear();
    querySphere(octreeNode, this.collisionSphere, node => {
      node.faces.forEach(face => this.nearbyFaces.add(face));
    });

    findWallCollisionsFromList(this.nearbyFaces, this);

    if (this.isGroundedThisFrame) {
      this.groundedTimer = 0;
      this.isGrounded = true;
    } else { // here the player is in the air
      this.groundedTimer++; // increase timer while they are in the air.
      this.isGrounded = this.groundedTimer < 10; // if they are in the air longer than x frames, they are no longer grounded
    }

    if (!this.isGrounded) {
      this.updatePlayerPitchRoll(new EnhancedDOMPoint(0,1,0), 0.03);
    }

    this.collisionSphere.center.add_(this.velocity);
  }

  updatePlayerPitchRoll(targetPoint: EnhancedDOMPoint, lerpAmount: number) {
    this.smoothedNormal.lerp(targetPoint, lerpAmount).normalize_();
    this.mesh.rotationMatrix = new DOMMatrix();
    const axis = new EnhancedDOMPoint().crossVectors(this.mesh.up, this.smoothedNormal);
    const radians = Math.acos(this.smoothedNormal.dot(this.mesh.up));
    this.mesh.rotationMatrix.rotateAxisAngleSelf(axis.x, axis.y, axis.z, radsToDegrees(radians));
  }

  private targetVelocity = new EnhancedDOMPoint();

  jumpBuffer = {
    isBuffered: false,
    frameCount: 0,
  }

  protected updateVelocityFromControls() {
    const speedMultiplier = 0.24;

    this.targetVelocity.set(0,0,0);

    if (controls.leftStickMagnitude > 0.01) {
      const camDir = new EnhancedDOMPoint().set(this.camera.rotationMatrix.transformPoint(new EnhancedDOMPoint(0, 0, -1)));
      camDir.y = 0;
      camDir.normalize_();

      const camRight = new EnhancedDOMPoint(camDir.z, 0, -camDir.x);
      this.targetVelocity.x = (camDir.x * -controls.inputDirection.y + camRight.x * -controls.inputDirection.x) * speedMultiplier;
      this.targetVelocity.z = (camDir.z * -controls.inputDirection.y + camRight.z * -controls.inputDirection.x) * speedMultiplier;
    }

    this.velocity.x += (this.targetVelocity.x - this.velocity.x) * 0.25;
    this.velocity.z += (this.targetVelocity.z - this.velocity.z) * 0.25;

      // Face direction of movement
    if (!this.isTakingHit) {
      this.angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.children_[0].setRotation_(0, this.angle, 0);
    }

    if (controls.isJump && !controls.isPrevJump) {
      this.jumpBuffer.isBuffered = true;
    }

    if (this.jumpBuffer.isBuffered) {
      this.jumpBuffer.frameCount++;
      if (this.jumpBuffer.frameCount > 10) {
        this.jumpBuffer.isBuffered = false;
        this.jumpBuffer.frameCount = 0;
      }
    }

    if (this.jumpBuffer.isBuffered && this.isGrounded && !this.isJumping) {
      this.velocity.y = 0.5;
      this.isJumping = true;
      jumpSound();
      this.jumpBuffer.isBuffered = false;
      this.jumpBuffer.frameCount = 0;
    }
  }
}
