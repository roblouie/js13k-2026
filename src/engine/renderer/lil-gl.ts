import {
  depth_fragment_glsl,
  depth_vertex_glsl,
  fragment_glsl, particle_fragment_glsl,
  particle_vertex_glsl,
  shadowCubeMap,
  shadowMap,
  skybox_fragment_glsl,
  skybox_vertex_glsl,
  uSampler,
  vertex_glsl, worldReveal
} from '@/engine/shaders/shaders';

export class LilGl {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  skyboxProgram: WebGLProgram;
  depthProgram: WebGLProgram;
  particleProgram: WebGLProgram;

 constructor() {
   // @ts-ignore
   this.gl = c3d.getContext('webgl2')!;
   const vertex = this.createShader(this.gl.VERTEX_SHADER, vertex_glsl);
   const fragment = this.createShader(this.gl.FRAGMENT_SHADER, fragment_glsl);
   this.program = this.createProgram(vertex, fragment);

   const skyboxVertex = this.createShader(this.gl.VERTEX_SHADER, skybox_vertex_glsl);
   const skyboxFragment = this.createShader(this.gl.FRAGMENT_SHADER, skybox_fragment_glsl);
   this.skyboxProgram = this.createProgram(skyboxVertex, skyboxFragment);

   const depthVertex = this.createShader(this.gl.VERTEX_SHADER, depth_vertex_glsl);
   const depthFragment = this.createShader(this.gl.FRAGMENT_SHADER, depth_fragment_glsl);
   this.depthProgram = this.createProgram(depthVertex, depthFragment);

   const particleVertex = this.createShader(this.gl.VERTEX_SHADER, particle_vertex_glsl);
   const particleFragment = this.createShader(this.gl.FRAGMENT_SHADER, particle_fragment_glsl);
   this.particleProgram = this.createProgram(particleVertex, particleFragment);

   const shadowMapLocation = this.gl.getUniformLocation(this.program, shadowMap);
   const textureLocation = this.gl.getUniformLocation(this.program, uSampler);
   const worldRevealLocation = this.gl.getUniformLocation(this.program, worldReveal);
   const skyboxLocation = this.gl.getUniformLocation(this.skyboxProgram, uSampler)!;

   this.gl.useProgram(this.program);
   this.gl.uniform1i(textureLocation, 0);
   this.gl.uniform1i(shadowMapLocation, 1);
   this.gl.uniform1i(worldRevealLocation, 3);

   this.gl.useProgram(this.skyboxProgram);
   this.gl.uniform1i(skyboxLocation, 2);
 }

  createShader(type: GLenum, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.log(this.gl.getShaderInfoLog(vertexShader));
      console.log(this.gl.getShaderInfoLog(fragmentShader));
    }

    return program;
  }
}

export const lilgl = new LilGl();
export const gl = lilgl.gl;
