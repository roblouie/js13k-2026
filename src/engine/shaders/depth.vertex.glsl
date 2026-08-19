#version 300 es

//[
precision highp float;
//]
layout(location = 1) in float aDepth;
layout(location=2) in vec4 aCoords;

uniform mat4 lightPovMvp;

out float vDepth;

void main(){
    gl_Position = lightPovMvp * aCoords;
    vDepth = aDepth;
}
