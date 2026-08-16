#version 300 es

layout(location = 0) in vec2 aTexCoord;
layout(location = 1) in float aDepth;
layout(location = 2) in vec3 aCoords;
layout(location = 3) in vec3 aCoords1;
layout(location = 4) in vec3 aCoords2;
layout(location = 5) in vec3 aCoords3;
layout(location = 6) in vec3 aNormal;
layout(location = 7) in vec3 aNormal1;
layout(location = 8) in vec3 aNormal2;
layout(location = 9) in vec3 aNormal3;

uniform vec3 playerPosition;

uniform mat4 modelviewProjection;
uniform mat4 normalMatrix;
uniform mat4 lightPovMvp;
uniform mat4 worldMatrix;

uniform float alpha;
uniform int frameA;
uniform int frameB;
vec4 keyframes[4];
vec3 normalFrames[4];

out vec2 vTexCoord;
out float vDepth;
out vec3 vNormal;
out mat4 vNormalMatrix;
out vec4 positionFromLightPov;
out vec3 vPlayerPosition;
out vec3 vWorldPosition;

void main() {
    keyframes[0] = vec4(aCoords, 1.0);
    keyframes[1] = vec4(aCoords1, 1.0);
    keyframes[2] = vec4(aCoords2, 1.0);
    keyframes[3] = vec4(aCoords3, 1.0);

    normalFrames[0] = aNormal;
    normalFrames[1] = aNormal1;
    normalFrames[2] = aNormal2;
    normalFrames[3] = aNormal3;

    vec4 coords = mix(keyframes[frameA], keyframes[frameB], alpha);
    gl_Position = modelviewProjection * coords;

    vTexCoord = aTexCoord;
    vDepth = aDepth;
    vNormal = aNormal;
    vNormalMatrix = normalMatrix;
    positionFromLightPov = lightPovMvp * coords;
    vPlayerPosition = playerPosition;
    vWorldPosition = (worldMatrix * coords).xyz;
}
