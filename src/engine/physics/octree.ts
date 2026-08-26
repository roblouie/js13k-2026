import {Face} from "@/engine/physics/face";
import {AABB, isAABBOverlapping, isSphereOverlappingAABB, Sphere} from "@/engine/physics/aabb";
import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";

export function querySphere(node: OctreeNode, sphere: Sphere, onLeaf: (node: OctreeNode) => void) {
  if (!isSphereOverlappingAABB(sphere, node.bounds_)) {
    return;
  }

  if (!node.children_) {
    onLeaf(node);
  } else {
    node.children_.forEach(child => querySphere(child, sphere, onLeaf));
  }
}

export class OctreeNode {
  bounds_: AABB;
  faces: Face[] = [];
  children_: OctreeNode[] | null = null;
  depth: number;

  static MAX_TRIANGLES = 20;
  static MAX_DEPTH = 6;
  static MIN_SIZE = 1;

  constructor(bounds: AABB, depth = 0) {
    this.bounds_ = bounds;
    this.depth = depth;
  }

  private isBigEnough() {
    return (this.bounds_.max.y - this.bounds_.min.y) >= OctreeNode.MIN_SIZE
      && (this.bounds_.max.z - this.bounds_.min.z) >= OctreeNode.MIN_SIZE
      && (this.bounds_.max.x - this.bounds_.min.x) >= OctreeNode.MIN_SIZE;
  }

  insert(face: Face) {
    if (!this.children_) {
      this.faces.push(face);

      if (this.faces.length > OctreeNode.MAX_TRIANGLES && this.depth < OctreeNode.MAX_DEPTH && this.isBigEnough()) {
        this.subdivide();
        for (const tri of this.faces) {
          this.insertIntoChildren(tri);
        }
        this.faces = [];
      }
    } else {
      this.insertIntoChildren(face);
    }
  }

  private insertIntoChildren(face: Face) {
    for (const child of this.children_!) {
      if (isAABBOverlapping(face.aabb, child.bounds_)) {
        child.insert(face);
      }
    }
  }

  private subdivide() {
    const {min, max} = this.bounds_;
    const center = {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2,
    };

    this.children_ = [];

    for (let i = 0; i < 8; i++) {
      const childMin = {
        x: (i & 1) ? center.x : min.x,
        y: (i & 2) ? center.y : min.y,
        z: (i & 4) ? center.z : min.z,
      };
      const childMax = {
        x: (i & 1) ? max.x : center.x,
        y: (i & 2) ? max.y : center.y,
        z: (i & 4) ? max.z : center.z,
      };

      this.children_.push(new OctreeNode({min: childMin, max: childMax}, this.depth + 1));
    }
  }
}
