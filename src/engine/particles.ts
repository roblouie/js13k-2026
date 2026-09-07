import {gl} from "@/engine/renderer/lil-gl";
import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";

type Particle = {
  position_: EnhancedDOMPoint;
  size_: number;
  life: number;
  isAffectedByGravity: boolean;
  velocity: EnhancedDOMPoint;
  sizeModifier: number;
  lifeModifier: number;
  textureId: number;
  modifierCallback?: (particle: Particle) => void;
};

export const particles: Particle[] = [];

export const randomNegativeOneOne = () => Math.random() * 2 - 1;

export const particleSpreadRadius = (basePosition: EnhancedDOMPoint, radius: number) => basePosition.clone_().add_(new EnhancedDOMPoint(randomNegativeOneOne() * radius, randomNegativeOneOne() * radius, randomNegativeOneOne() * radius))
export const particleRandomizeHorizontal = (x: number, y: number) => new EnhancedDOMPoint(randomNegativeOneOne() * x, randomNegativeOneOne() * 0.1 + y, randomNegativeOneOne() * x);

export function wireParticles(): [WebGLVertexArrayObject, () => number] {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const particleBuffer = gl.createBuffer();
  gl.bindBuffer(34962, particleBuffer);

// 5 floats per particle (x,y,z, size, life, texture id)
  const STRIDE = 6 * 4; // bytes

// position
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, 5126, false, STRIDE, 0);

// size
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, 5126, false, STRIDE, 3 * 4);

// life
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, 5126, false, STRIDE, 4 * 4);

  // texture id
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 1, 5126, false, STRIDE, 5 * 4);

  function updateParticles() {
    if (!particles.length) {
      return 0;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].modifierCallback) {
        particles[i].modifierCallback!(particles[i]);
        continue;
      }
      const p = particles[i];
      if (p.isAffectedByGravity) {
        p.velocity.y -= 0.03;
      }
      p.life -= p.lifeModifier;
      p.size_ += p.sizeModifier;
      p.position_.add_(p.velocity);
      if (p.life <= 0) {
        particles.splice(i, 1); // remove dead
      }
    }

    const data = new Float32Array(particles.length * 6);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const o = i * 6;
      data[o] = p.position_.x;
      data[o+1] = p.position_.y;
      data[o+2] = p.position_.z;
      data[o+3] = p.size_;
      data[o+4] = p.life;
      data[o+5] = p.textureId;
    }
    gl.bindBuffer(34962, particleBuffer);
    gl.bufferData(34962, data, 35048);

    return particles.length;
  }

  return [vao, updateParticles];
}


