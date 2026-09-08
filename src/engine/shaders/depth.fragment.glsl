#version 300 es

//[
precision highp float;
//]

out float fragDepth;
in float vDepth;

void main(){
    if (vDepth < 2.0f) {
        discard;
    }
    fragDepth = gl_FragCoord.z;
}
