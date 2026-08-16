import {Face} from "@/engine/physics/face";
import {AABB, isAABBOverlapping, isSphereOverlappingAABB, Sphere} from "@/engine/physics/aabb";
import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";
import {Witch} from "@/engine/witch-manager";

export function querySphere(node: OctreeNode, sphere: Sphere, onLeaf: (node: OctreeNode) => void) {
  if (!isSphereOverlappingAABB(sphere, node.bounds)) {
    return;
  }

  if (!node.children) {
    onLeaf(node);
  } else {
    node.children.forEach(child => querySphere(child, sphere, onLeaf));
  }
}

export class OctreeNode {
  bounds: AABB;
  faces: Face[] = [];
  witches?: Witch[];
  children: OctreeNode[] | null = null;
  depth: number;

  static MAX_TRIANGLES = 10;
  static MAX_DEPTH = 6;
  static MIN_SIZE = 1;

  constructor(bounds: AABB, depth = 0) {
    this.bounds = bounds;
    this.depth = depth;
  }

  private isBigEnough() {
    return (this.bounds.max.y - this.bounds.min.y) >= OctreeNode.MIN_SIZE
      && (this.bounds.max.z - this.bounds.min.z) >= OctreeNode.MIN_SIZE
      && (this.bounds.max.x - this.bounds.min.x) >= OctreeNode.MIN_SIZE;
  }

  insert(face: Face) {
    if (!this.children) {
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
    for (const child of this.children!) {
      if (isAABBOverlapping(face.aabb, child.bounds)) {
        child.insert(face);
      }
    }
  }

  private subdivide() {
    const {min, max} = this.bounds;
    const center = {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2,
    };

    this.children = [];

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

      this.children.push(new OctreeNode({min: childMin, max: childMax}, this.depth + 1));
    }
  }
}