import { gl, lilgl } from "@/engine/renderer/lil-gl";
import { Camera } from "@/engine/renderer/camera";

import { Scene } from '@/engine/renderer/scene';
import {
  alpha, frameA, frameB,
  lightPovMvp,
  modelviewProjection,
  normalMatrix, playerPosition,
  u_viewDirectionProjectionInverse, uSampler, uViewProj, worldMatrix,
} from '@/engine/shaders/shaders';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';
import {createOrtho, Object3d} from "@/engine/renderer/object-3d";
import {wireParticles} from "@/engine/particles";
import {Mesh} from "@/engine/renderer/mesh";
import {ThirdPersonPlayer} from "@/core/third-person-player";

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

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

const modelviewProjectionLocation = gl.getUniformLocation(lilgl.program, modelviewProjection)!;
const normalMatrixLocation =  gl.getUniformLocation(lilgl.program, normalMatrix)!;
const viewDirectionProjectionInverseLocation = gl.getUniformLocation(lilgl.skyboxProgram, u_viewDirectionProjectionInverse)!;
const playerLocationLocation = gl.getUniformLocation(lilgl.program, playerPosition);
const worldMatrixLocation = gl.getUniformLocation(lilgl.program, worldMatrix);

const origin = new EnhancedDOMPoint(0, 0, 0);

const lightPovProjection = createOrtho(-320,320,-320,320,-400,400);

const inverseLightDirection = new EnhancedDOMPoint(-0.3, 0.5, -0.2).normalize_();
const lightPovView = new Object3d();
lightPovView.position.set(inverseLightDirection);
lightPovView.lookAt(origin);
lightPovView.rotationMatrix.invertSelf();

const lightPovMvpMatrix = lightPovProjection.multiply(lightPovView.rotationMatrix);

const lightPovMvpDepthLocation = gl.getUniformLocation(lilgl.depthProgram, lightPovMvp);
gl.useProgram(lilgl.depthProgram);
gl.uniformMatrix4fv(lightPovMvpDepthLocation, false, lightPovMvpMatrix.toFloat32Array());

const textureSpaceConversion = new DOMMatrix([
  0.5, 0.0, 0.0, 0.0,
  0.0, 0.5, 0.0, 0.0,
  0.0, 0.0, 0.5, 0.0,
  0.5, 0.5, 0.5, 1.0
]);

const textureSpaceMvp = textureSpaceConversion.multiplySelf(lightPovMvpMatrix);
const lightPovMvpRenderLocation = gl.getUniformLocation(lilgl.program, lightPovMvp);

gl.useProgram(lilgl.program);

const depthTextureSize = new DOMPoint(4096, 4096);
const depthTexture = gl.createTexture();
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, depthTexture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, depthTextureSize.x, depthTextureSize.y);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const depthFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

const alphaLocation = gl.getUniformLocation(lilgl.program, alpha);
const frameALocation = gl.getUniformLocation(lilgl.program, frameA);
const frameBLocation = gl.getUniformLocation(lilgl.program, frameB);

// particle setup
const [particleVao, drawParticles] = wireParticles();
const particleViewProjectionMatrixLocation = gl.getUniformLocation(lilgl.particleProgram, uViewProj);
// end particle setup


function renderMesh(mesh: Mesh, viewProjectionMatrix: DOMMatrix) {
  const modelViewProjectionMatrix = viewProjectionMatrix.multiply(mesh.worldMatrix);
  gl.uniformMatrix4fv(lightPovMvpRenderLocation, false, textureSpaceMvp.multiply(mesh.worldMatrix).toFloat32Array());

  gl.uniform1i(frameALocation, mesh.frameA);
  gl.uniform1i(frameBLocation, mesh.frameB);
  gl.uniform1f(alphaLocation, mesh.alpha);
  gl.uniformMatrix4fv(worldMatrixLocation, false, mesh.worldMatrix.toFloat32Array());

  gl.vertexAttrib1f(AttributeLocation.TextureDepth, mesh.material?.texture?.id ?? -1.0);
  gl.bindVertexArray(mesh.geometry.vao!);

  // @ts-ignore
  gl.uniformMatrix4fv(normalMatrixLocation, true, mesh.worldMatrix.inverse().toFloat32Array());
  gl.uniformMatrix4fv(modelviewProjectionLocation, false, modelViewProjectionMatrix.toFloat32Array());

  gl.drawElements(gl.TRIANGLES, mesh.geometry.getIndices()!.length, gl.UNSIGNED_SHORT, 0);
}

export function render(camera: Camera, scene: Scene, player: ThirdPersonPlayer, worldRevealed: Uint8Array) {
  const viewMatrix = camera.worldMatrix.inverse();
  const viewMatrixCopy = viewMatrix.scale(1, 1, 1);
  const viewProjectionMatrix = camera.projection.multiply(viewMatrix);

  gl.uniform3fv(playerLocationLocation, new Float32Array(player.collisionSphere.center.toArray()));

  // ---------------------------------------------------
  // Render shadow map to depth texture
  // ---------------------------------------------------
  gl.useProgram(lilgl.depthProgram);
  gl.cullFace(gl.BACK);
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, depthTextureSize.x, depthTextureSize.y);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  scene.solidMeshes.forEach((mesh, index) => {
      gl.bindVertexArray(mesh.geometry.vao!);
      gl.uniformMatrix4fv(lightPovMvpDepthLocation, false, lightPovMvpMatrix.multiply(mesh.worldMatrix).toFloat32Array());
      gl.drawElements(gl.TRIANGLES, mesh.geometry.getIndices()!.length, gl.UNSIGNED_SHORT, 0);
  });
  // End render shadow map


  gl.useProgram(lilgl.program);

  // Render solid meshes first
  gl.activeTexture(gl.TEXTURE0);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  scene.solidMeshes.forEach(mesh => renderMesh(mesh, viewProjectionMatrix));

  gl.depthFunc(gl.LEQUAL);
  gl.useProgram(lilgl.skyboxProgram);

  gl.activeTexture(gl.TEXTURE2);
  viewMatrixCopy.m41 = 0;
  viewMatrixCopy.m42 = 0;
  viewMatrixCopy.m43 = 0;
  const inverseViewProjection = camera.projection.multiply(viewMatrixCopy).inverse();
  gl.uniformMatrix4fv(viewDirectionProjectionInverseLocation, false, inverseViewProjection.toFloat32Array());
  gl.bindVertexArray(scene.skybox.vao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.depthFunc(gl.LESS);

  // --------------Particle test start
  gl.useProgram(lilgl.particleProgram);
  gl.bindVertexArray(particleVao);

// bind uniforms
  gl.uniformMatrix4fv(particleViewProjectionMatrixLocation, false, viewProjectionMatrix.toFloat32Array());

// draw
  gl.drawArrays(gl.POINTS, 0, drawParticles());
  //------------- Particle test end

  gl.useProgram(lilgl.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.blendFunc(gl.SRC_ALPHA, gl.SRC_ALPHA);
  scene.transparentMeshes.forEach(mesh => {
    mesh.updateWorldMatrix();
    renderMesh(mesh, viewProjectionMatrix);
  });


  // Unbinding the vertex array being used to make sure the last item drawn isn't still bound on the next draw call.
  // In theory this isn't necessary but avoids bugs.
  gl.bindVertexArray(null);
}
