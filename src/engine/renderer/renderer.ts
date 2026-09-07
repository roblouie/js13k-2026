import { gl, lilgl } from "@/engine/renderer/lil-gl";
import { Camera } from "@/engine/renderer/camera";

import { Scene } from '@/engine/renderer/scene';
import {
  alpha, frameA, frameB, fromIndex,
  lightPovMvp,
  modelviewProjection,
  normalMatrix, playerPosition, toBlend, toIndex,
  u_viewDirectionProjectionInverse, uSampler, uViewProj, worldMatrix,
} from '@/engine/shaders/shaders';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';
import {createOrtho, Object3d} from "@/engine/renderer/object-3d";
import {wireParticles} from "@/engine/particles";
import {Mesh} from "@/engine/renderer/mesh";
import {ThirdPersonPlayer} from "@/core/third-person-player";
import {textureLoader} from "@/engine/renderer/texture-loader";

// IMPORTANT! The index of a given buffer in the buffer array must match it's respective data location in the shader.
// This allows us to use the index while looping through buffers to bind the attributes. So setting a buffer
// happens by placing
export const enum AttributeLocation {
  TextureCoords,
  TextureDepth,
  Positions,
  Positions2,
  Positions3,
  Positions4,
  Normals,
  Normals2,
  Normals3,
  Normals4,
}

gl.enable(2884);
gl.enable(2929);
gl.enable(3042);

const modelviewProjectionLocation = gl.getUniformLocation(lilgl.program, modelviewProjection)!;
const normalMatrixLocation =  gl.getUniformLocation(lilgl.program, normalMatrix)!;
const viewDirectionProjectionInverseLocation = gl.getUniformLocation(lilgl.skyboxProgram, u_viewDirectionProjectionInverse)!;
const fromIndexLocation = gl.getUniformLocation(lilgl.skyboxProgram, fromIndex);
const toIndexLocation = gl.getUniformLocation(lilgl.skyboxProgram, toIndex);
const toBlendLocation = gl.getUniformLocation(lilgl.skyboxProgram, toBlend);
const playerLocationLocation = gl.getUniformLocation(lilgl.program, playerPosition);
const worldMatrixLocation = gl.getUniformLocation(lilgl.program, worldMatrix);

const shadowCenter = new EnhancedDOMPoint(0, 0, 0);

const lightPovProjection = createOrtho(-300,300,-300,300,-400,400);

const lightDirection = new EnhancedDOMPoint(-0.3, 0.5, -0.2).normalize_();
const lightPovView = new Object3d();
lightPovView.position_.set(lightDirection);

let lightPovMvpMatrix = new DOMMatrix();

const lightPovMvpDepthLocation = gl.getUniformLocation(lilgl.depthProgram, lightPovMvp);
gl.useProgram(lilgl.depthProgram);
gl.uniformMatrix4fv(lightPovMvpDepthLocation, false, lightPovMvpMatrix.toFloat32Array());

const lightPovMvpRenderLocation = gl.getUniformLocation(lilgl.program, lightPovMvp);

gl.useProgram(lilgl.program);

const depthTextureSize = new DOMPoint(4096, 4096);
const depthTexture = gl.createTexture();
gl.activeTexture(33985);
gl.bindTexture(3553, depthTexture);
gl.texStorage2D(3553, 1, 36012, depthTextureSize.x, depthTextureSize.y);
gl.texParameteri(3553, 34892, 34894);
gl.texParameteri(3553, 10242, 33071);
gl.texParameteri(3553, 10243, 33071);

const depthFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(36160, depthFramebuffer);
gl.framebufferTexture2D(36160, 36096, 3553, depthTexture, 0);

const alphaLocation = gl.getUniformLocation(lilgl.program, alpha);
const frameALocation = gl.getUniformLocation(lilgl.program, frameA);
const frameBLocation = gl.getUniformLocation(lilgl.program, frameB);

// particle setup
const [particleVao, drawParticles] = wireParticles();
const particleViewProjectionMatrixLocation = gl.getUniformLocation(lilgl.particleProgram, uViewProj);
// end particle setup


function renderMesh(mesh: Mesh, viewProjectionMatrix: DOMMatrix) {
  const modelViewProjectionMatrix = viewProjectionMatrix.multiply(mesh.worldMatrix);
  gl.uniformMatrix4fv(lightPovMvpRenderLocation, false, lightPovMvpMatrix.multiply(mesh.worldMatrix).toFloat32Array());

  gl.uniform1i(frameALocation, mesh.frameA);
  gl.uniform1i(frameBLocation, mesh.frameB);
  gl.uniform1f(alphaLocation, mesh.alpha);
  gl.uniformMatrix4fv(worldMatrixLocation, false, mesh.worldMatrix.toFloat32Array());

  gl.vertexAttrib1f(AttributeLocation.TextureDepth, mesh.material?.texture?.id ?? -1.0);
  gl.bindVertexArray(mesh.geometry.vao!);

  // @ts-ignore
  gl.uniformMatrix4fv(normalMatrixLocation, true, mesh.worldMatrix.inverse().toFloat32Array());
  gl.uniformMatrix4fv(modelviewProjectionLocation, false, modelViewProjectionMatrix.toFloat32Array());

  gl.drawElements(4, mesh.geometry.getIndices()!.length, 5123, 0);
}

export function render(camera: Camera, scene: Scene, player: ThirdPersonPlayer) {
  const viewMatrix = camera.worldMatrix.inverse();
  const viewMatrixCopy = viewMatrix.scale(1, 1, 1);
  const viewProjectionMatrix = camera.projection.multiply(viewMatrix);

  // ---------------------------------------------------
  // Render shadow map to depth texture
  // ---------------------------------------------------
  gl.useProgram(lilgl.depthProgram);
  gl.cullFace(1028);
  gl.bindFramebuffer(36160, depthFramebuffer);
  gl.clear(16384 | 256);
  gl.viewport(0, 0, depthTextureSize.x, depthTextureSize.y);
  gl.blendFunc(770, 771);

  shadowCenter.z = player.collisionSphere.center.z;
  lightPovView.position_.z = shadowCenter.z + lightDirection.z;
  lightPovView.lookAt(shadowCenter);
  lightPovView.updateWorldMatrix();
  lightPovView.worldMatrix.invertSelf();
  lightPovMvpMatrix = lightPovProjection.multiply(lightPovView.worldMatrix);
  gl.uniformMatrix4fv(lightPovMvpDepthLocation, false, lightPovMvpMatrix.toFloat32Array());

  scene.solidMeshes.forEach((mesh, index) => {
      gl.bindVertexArray(mesh.geometry.vao!);
      gl.uniformMatrix4fv(lightPovMvpDepthLocation, false, lightPovMvpMatrix.multiply(mesh.worldMatrix).toFloat32Array());
      gl.drawElements(4, mesh.geometry.getIndices()!.length, 5123, 0);
  });
  // End render shadow map

  gl.cullFace(1029);

  // skybox
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.bindFramebuffer(36160, null);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(16384 | 256);

  gl.depthFunc(515);
  gl.useProgram(lilgl.skyboxProgram);

  gl.activeTexture(33986);
  viewMatrixCopy.m41 = 0;
  viewMatrixCopy.m42 = 0;
  viewMatrixCopy.m43 = 0;
  const inverseViewProjection = camera.projection.multiply(viewMatrixCopy).inverse();
  gl.uniformMatrix4fv(viewDirectionProjectionInverseLocation, false, inverseViewProjection.toFloat32Array());
  gl.uniform1f(fromIndexLocation, textureLoader.fromSkybox);
  gl.uniform1f(toIndexLocation, textureLoader.toSkybox);
  gl.uniform1f(toBlendLocation, textureLoader.toBlend);
  gl.bindVertexArray(scene.skybox.vao);
  gl.drawArrays(4, 0, 6);
  gl.depthFunc(513);


  gl.useProgram(lilgl.program);
  gl.uniform3fv(playerLocationLocation, new Float32Array(player.collisionSphere.center.toArray()));

  // Render solid meshes first
  gl.activeTexture(33984);
  gl.texParameteri(35866, 10241, 9987);


  scene.solidMeshes.forEach((mesh, index) => {
    if (index >= 2) {
      gl.blendFunc(770, 1);
    }
    renderMesh(mesh, viewProjectionMatrix)
  });




  // --------------Particle test start
  gl.useProgram(lilgl.particleProgram);
  gl.blendFunc(770, 771);

  gl.bindVertexArray(particleVao);

// bind uniforms
  gl.uniformMatrix4fv(particleViewProjectionMatrixLocation, false, viewProjectionMatrix.toFloat32Array());

// draw
  gl.drawArrays(0, 0, drawParticles());
  //------------- Particle test end


  // Unbinding the vertex array being used to make sure the last item drawn isn't still bound on the next draw call.
  // In theory this isn't necessary but avoids bugs.
  // gl.bindVertexArray(null);
}
