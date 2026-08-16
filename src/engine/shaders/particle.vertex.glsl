#version 300 es

layout(location = 0) in vec3 aCoords;
layout(location = 1) in float aSize;
layout(location = 2) in float aLife;
layout(location = 3) in float aDepth;

uniform mat4 uViewProj;

out float vLife;
out float vDepth;

void main() {
    gl_Position = uViewProj * vec4(aCoords, 1.0);
    gl_PointSize = aSize;   // in screen pixels
    vLife = aLife;          // pass to frag
    vDepth = aDepth;
}
