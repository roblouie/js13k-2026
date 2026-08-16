import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";

export const cylinderSelector2 = (halfWidth = 2) => {
  return (vert: EnhancedDOMPoint) => Math.abs(vert.x) === halfWidth || Math.abs(vert.z) === halfWidth;
}