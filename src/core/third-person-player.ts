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
import {playHoof} from "@/sounds/test-encode-decode";

export class ThirdPersonPlayer {
  isJumping = false;
  isGroundedThisFrame = false;
  isGrounded = false;
  wasGrounded = false;
  groundedTimer = 0;
  smoothedNormal = new EnhancedDOMPoint(0, 1, 0);
  velocity = new EnhancedDOMPoint(-0.01, 0, 0.01);
  lookatTarget = new EnhancedDOMPoint();

  mesh: Object3d;
  camera: Camera;

  private jumpCount = 0;

  constructor(camera: Camera) {
    this.mesh = new Object3d(makeHorse());
    this.mesh.isUsingLookAt = true;
    this.camera = camera;
    this.reset();
  }

  reset() {
    this.camera.position_.set(137, 38, 34);
    this.lookatTarget.set(this.mesh.position_);
    this.collisionSphere = new Sphere(new EnhancedDOMPoint(126, 50, 44), 2);
    this.velocity.set(-0.01, 0, 0.01);
  }

  angle_ = 40;

  nearbyFaces = new Set<Face>();
  collisionSphere: Sphere;

  yaw = 40;
  pitch = .31;
  cameraSpeed = 0.04;
  maxPitch = 1.2;
  minPitch = -0.07;
  isFrozen_ = false;

  private hoofVolumes = [1.4, 0.9, 1.0, 1.6];
  private readonly hoofIntervals = [
    .1,
    .11,
    .14,
      .32,
  ];
  private hoofIndex = 0;
  private hoofTimer = 0;

  update(octreeNode: OctreeNode) {
    this.wasGrounded = this.isGrounded;

    if (!this.isFrozen_) {
      this.updateVelocityFromControls();  // set x / z velocity based on input
    }

    this.velocity.y -= 0.017; // gravity
    this.collisionSphere.center.add_(this.velocity);  // move the player position by the velocity

    this.velocity.y = clamp(this.velocity.y, -1, 1);
    this.collideWithLevel(octreeNode); // do collision detection, if collision is found, feetCenter gets pushed out of the collision
    this.collisionSphere.center.x = clamp(this.collisionSphere.center.x, -140, 140);
    this.collisionSphere.center.z = clamp(this.collisionSphere.center.z, 10, 1490);
    if (this.collisionSphere.center.y < -30) {
      this.collisionSphere.center.y = 150;
      this.velocity.y = 0;
    }

    this.mesh.position_.set(this.collisionSphere.center); // at this point, feetCenter is in the correct spot, so draw the mesh there
    this.mesh.position_.y += 0.65; // move up by half height so mesh ends at feet position

    // tmpl.innerHTML = `${this.mesh.position_.x}, ${this.mesh.position_.y}, ${this.mesh.position_.z} --- ${this.angle_} \n ${this.camera.position_.x}, ${this.camera.position_.y}, ${this.camera.position_.z}`;

    // STOP HERE IF FROZEN
    if (this.isFrozen_) {
      return;
    }

    const velocityMagnitude = this.velocity.magnitude;

    if (velocityMagnitude > 0.1) {
      const onGround = this.groundedTimer < 10 && !this.isJumping;
      const airAnimationSpeedAdjust = onGround ? 1.0 : 0.2;

      // tmpl.innerHTML = this.hoofTimer;
      if (onGround) {
        this.hoofTimer -= 0.06 * velocityMagnitude;

        if (this.hoofTimer <= 0) {
          playHoof(audioContext.currentTime, this.hoofVolumes[this.hoofIndex] * 2);
          this.hoofTimer += this.hoofIntervals[this.hoofIndex];
          this.hoofIndex = (this.hoofIndex + 1) % 4;
        }
      }

      const mesh = this.mesh.children_[0] as Mesh;
      mesh.alpha += velocityMagnitude * 0.4 * airAnimationSpeedAdjust;

      if (mesh.alpha >= 1) {
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
      const toCam = this.camera.position_.clone_().subtract(this.mesh.position_).normalize_();
      // recover spherical angles from vector
      this.yaw = Math.atan2(toCam.x, toCam.z);
    }

    const offsetX = distanceToKeep * Math.cos(this.pitch) * Math.sin(this.yaw);
    const offsetY = distanceToKeep * Math.sin(this.pitch);
    const offsetZ = distanceToKeep * Math.cos(this.pitch) * Math.cos(this.yaw);

    const desiredPosition = this.mesh.position_.clone_().add_({
      x: offsetX,
      y: offsetY,
      z: offsetZ
    });

    this.camera.position_.lerp(desiredPosition, 0.2);

    const toLookAt = this.mesh.position_.clone_();
    toLookAt.y += 3;

    this.lookatTarget.lerp(toLookAt, 0.7);
    // this.lookatTarget.y += 2;
    this.camera.lookAt(this.lookatTarget);
    this.camera.updateWorldMatrix();

    if (!this.wasGrounded && this.isGrounded) {
      this.jumpCount = 0;
      playHoof(audioContext.currentTime, 1.0);
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
    this.targetVelocity.set(0, 0, 0);

    if (controls.isGallop) {
      const steer = clamp(controls.inputDirection.x + controls.cameraDirection.x, -1, 1);
      this.angle_ -= steer * .04;

      this.targetVelocity.x = Math.sin(this.angle_) * .5;
      this.targetVelocity.z = Math.cos(this.angle_) * .5;
    }
    else if (controls.leftStickMagnitude > .01) {
      const camDir = new EnhancedDOMPoint().set(
          this.camera.rotationMatrix.transformPoint(
              new EnhancedDOMPoint(0, 0, -1)
          )
      );

      camDir.y = 0;
      camDir.normalize_();

      const camRight = new EnhancedDOMPoint(camDir.z, 0, -camDir.x);

      this.targetVelocity.x =
          (camDir.x * -controls.inputDirection.y +
              camRight.x * -controls.inputDirection.x) * .24;

      this.targetVelocity.z =
          (camDir.z * -controls.inputDirection.y +
              camRight.z * -controls.inputDirection.x) * .24;
    }

    this.velocity.x += (this.targetVelocity.x - this.velocity.x) * 0.25;
    this.velocity.z += (this.targetVelocity.z - this.velocity.z) * 0.25;

    // Face direction of movement
    const faceVelocity =
        controls.leftStickMagnitude > .01
            ? this.targetVelocity
            : this.velocity;
    if (!controls.isGallop) {
      this.angle_ = Math.atan2(faceVelocity.x, faceVelocity.z);
    }

    this.mesh.children_[0].setRotation_(0, this.angle_, 0);

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

    if (this.jumpBuffer.isBuffered && this.jumpCount < 2) {
      this.jumpCount++;

      this.velocity.y = .5;

      this.isJumping = true;
      jumpSound();
      this.jumpBuffer.isBuffered = false;
      this.jumpBuffer.frameCount = 0;
    }

    if (!controls.isJump && controls.isPrevJump && this.velocity.y > 0) {
      this.velocity.y *= .5;
    }

  }
}
