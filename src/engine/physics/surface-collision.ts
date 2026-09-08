import { Face } from './face';
import { EnhancedDOMPoint } from "@/engine/enhanced-dom-point";
import {ThirdPersonPlayer} from "@/core/third-person-player";
import {radsToDegrees} from "@/engine/helpers";
import {controls} from "@/core/controls";

export function findWallCollisionsFromList(surfaces: Set<Face>, player: ThirdPersonPlayer) {
  player.isGroundedThisFrame = false;

  for (const surface of surfaces) {
    const newSurfaceHit = testSphereTriangle(player.collisionSphere, surface);

    if (newSurfaceHit) {
      const depth = newSurfaceHit.penetrationDepth;

      // Handle simple collision with mostly flat ground by pushing you up by collision depth
      if (surface.normal.y >= 0.7 && player.velocity.y <= 0) {
        player.updatePlayerPitchRoll(surface.normal, 0.3)
        player.collisionSphere.center.y += depth;
        player.velocity.y = 0;
        player.isJumping = false;
        player.isGroundedThisFrame = true;
        continue; // Stop here if we have landed on mostly flat ground
      }

      const tooSteep = surface.normal.y > 0 && surface.normal.y < .5;
      let normal = newSurfaceHit.penetrationNormal;
      let correctionDepth = depth;

      if (tooSteep) {
        const horizontalLength = Math.hypot(normal.x, normal.z);

        normal = new EnhancedDOMPoint(
            normal.x / horizontalLength,
            0,
            normal.z / horizontalLength
        );

        correctionDepth /= horizontalLength;
      }

      player.collisionSphere.center.add_(normal.clone_().scale_(depth));

      const normalSpeed = player.velocity.dot(normal);
      if (normalSpeed < 0) {
        player.velocity.subtract(normal.clone_().scale_(normalSpeed));
      }

      // Now, deal with ceilings next and stop the loop if the surface is a ceiling
      if (surface.normal.y <= -0.6) {
        if (player.velocity.y > 0) {
          player.velocity.y = 0;  // cancel player upward momentum if they are moving up
        }
        continue; // whether they are moving up or not, the surface is a ceiling so we can stop caring about it
      }

      // At this point, it's either a walkable slop, a too-steep unwalkable slope, or a wall.
      // As we've already resolved the collision, we don't care about walls at all.
      if (surface.normal.y >= 0.6) { // walkable slope
        player.isGroundedThisFrame = true;
        player.isJumping = false;
        player.updatePlayerPitchRoll(surface.normal, 0.3);
      }
    }
  }
}

function testSphereTriangle(s: { center: EnhancedDOMPoint, radius: number }, wall: Face) {
  // Ignore back sides of triangles
  const dist = new EnhancedDOMPoint().subtractVectors(s.center, wall.points_[0]).dot(wall.normal);
  if (dist < 0) {
    return;
  }

  const p = closestPointInTriangle(s.center, wall.points_[0], wall.points_[1], wall.points_[2]);
  const v = new EnhancedDOMPoint().subtractVectors(s.center, p);
  const squaredDistanceFromPointOnTriangle = v.dot(v);
  const isColliding = squaredDistanceFromPointOnTriangle <= s.radius * s.radius;
  if (isColliding) {
    const penetrationNormal = v.normalize_();
    const penetrationDepth = s.radius - Math.sqrt(squaredDistanceFromPointOnTriangle);
    return {
      penetrationNormal,
      penetrationDepth,
    };
  }
}

function closestPointInTriangle(p: EnhancedDOMPoint, a: EnhancedDOMPoint, b: EnhancedDOMPoint, c: EnhancedDOMPoint) {
  const ab = new EnhancedDOMPoint().subtractVectors(b, a);
  const ac = new EnhancedDOMPoint().subtractVectors(c, a);
  const ap = new EnhancedDOMPoint().subtractVectors(p, a);

  const d1 = ab.dot(ap);
  const d2 = ac.dot(ap);

  if (d1 <= 0 && d2 <= 0) return a;

  const bp = new EnhancedDOMPoint().subtractVectors(p, b);
  const d3 = ab.dot(bp);
  const d4 = ac.dot(bp);

  if (d3 >= 0 && d4 <= d3) return b;

  const vc = d1 * d4 - d3 * d2;

  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const denom = d1 - d3;
    if (Math.abs(denom) < 1e-8) return a;
    const v = d1 / denom;    return new EnhancedDOMPoint().addVectors(a, new EnhancedDOMPoint().set(ab).scale_(v));
  }

  const cp = new EnhancedDOMPoint().subtractVectors(p, c);
  const d5 = ab.dot(cp);
  const d6 = ac.dot(cp);

  if (d6 >= 0 && d5 <= d6) return c;

  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const denom = d2 - d6;
    if (Math.abs(denom) < 1e-8) return a;
    const w = d2 / denom;
    return new EnhancedDOMPoint().addVectors(a, new EnhancedDOMPoint().set(ac).scale_(w));
  }

  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
    const denom = (d4 - d3) + (d5 - d6);
    if (Math.abs(denom) < 1e-8) return b;
    const w = (d4 - d3) / denom;
    const wbc = new EnhancedDOMPoint().subtractVectors(c, b).scale_(w);
    return new EnhancedDOMPoint().addVectors(b, wbc);
  }

  const denom = 1 / (va + vb + vc);
  const v = vb * denom;
  const w = vc * denom;
  const abv = new EnhancedDOMPoint().set(ab).scale_(v);
  const acw = new EnhancedDOMPoint().set(ac).scale_(w);
  return new EnhancedDOMPoint().addVectors(abv, acw).add_(a);
}
