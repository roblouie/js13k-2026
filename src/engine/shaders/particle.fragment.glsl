#version 300 es

//[
precision highp float;
//]

in float vLife;
in float vDepth;
out vec4 fragColor;

uniform mediump sampler2DArray uSampler;

void main() {
    // gl_PointCoord is vec2(0..1)vec3(gl_PointCoord, 0.1)
    vec4 texColor = texture(uSampler, vec3(gl_PointCoord, vDepth));

    // fade with life
    float alpha = texColor.a * vLife;

    if (alpha < 0.01) discard; // soft edges
    fragColor = vec4(texColor.rgb, alpha);
}