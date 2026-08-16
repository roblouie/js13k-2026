import {gl} from "@/engine/renderer/lil-gl";
import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";

type Particle = {
  position: EnhancedDOMPoint;
  size: number;
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
  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);

// 5 floats per particle (x,y,z, size, life, texture id)
  const STRIDE = 6 * 4; // bytes

// position
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE, 0);

// size
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, STRIDE, 3 * 4);

// life
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, STRIDE, 4 * 4);

  // texture id
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, STRIDE, 5 * 4);

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
      p.size += p.sizeModifier;
      p.position.add_(p.velocity);
      if (p.life <= 0) {
        particles.splice(i, 1); // remove dead
      }
    }

    const data = new Float32Array(particles.length * 6);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const o = i * 6;
      data[o] = p.position.x;
      data[o+1] = p.position.y;
      data[o+2] = p.position.z;
      data[o+3] = p.size;
      data[o+4] = p.life;
      data[o+5] = p.textureId;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    return particles.length;
  }

  return [vao, updateParticles];
}


