#version 300 es
//[
precision highp float;
//]

uniform mediump sampler2DArray uSampler;
uniform mat4 u_viewDirectionProjectionInverse;

uniform float toBlend;
uniform float fromIndex;
uniform float toIndex;

in vec4 v_position;
out vec4 outColor;

const float PI = 3.14;

void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    vec3 dir = normalize(t.xyz / t.w);

    // Convert direction to spherical (longitude, latitude)
    float lon = atan(dir.x, dir.z);     // range -PI..PI
    float lat = asin(clamp(dir.y, -1.0, 1.0)); // range -PI/2..PI/2

    // Map to [0,1]
    vec2 uv;
    uv.x = (lon / (2.0 * PI)) + 0.5;
    uv.y = (lat / PI) + 0.5;

    // Sample
    vec4 fromPixel = texture(uSampler, vec3(uv, fromIndex));
    vec4 toPixel = texture(uSampler, vec3(uv, toIndex));

    outColor = mix(fromPixel, toPixel, toBlend);
}
