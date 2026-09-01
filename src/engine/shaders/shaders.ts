// Generated with Shader Minifier 1.3.4 (https://github.com/laurentlb/Shader_Minifier/)
export const aCoords = 'i';
export const aCoords1 = 'R';
export const aCoords2 = 'C';
export const aCoords3 = 'B';
export const aDepth = 'm';
export const aLife = 'M';
export const aNormal = 'O';
export const aNormal1 = 'G';
export const aNormal2 = 'H';
export const aNormal3 = 'P';
export const aSize = 'c';
export const aTexCoord = 'J';
export const alpha = 'V';
export const fragColor = 'K';
export const fragDepth = 'v';
export const frameA = 'W';
export const frameB = 'X';
export const fromIndex = 'N';
export const lightPovMvp = 't';
export const modelviewProjection = 'S';
export const normalMatrix = 'T';
export const outColor = 'g';
export const playerPosition = 'Q';
export const positionFromLightPov = 'u';
export const shadowMap = 'z';
export const toBlend = 'I';
export const toIndex = 'E';
export const uSampler = 's';
export const uViewProj = 'w';
export const u_viewDirectionProjectionInverse = 'D';
export const vDepth = 'f';
export const vLife = 'L';
export const vNormal = 'n';
export const vNormalMatrix = 'o';
export const vPlayerPosition = 'e';
export const vTexCoord = 'l';
export const vWorldPosition = 'd';
export const v_position = 'F';
export const worldMatrix = 'U';
export const worldReveal = 'h';

export const depth_fragment_glsl = `#version 300 es
precision highp float;
out float v;in float f;void main(){v=gl_FragCoord.z;}`;

export const depth_vertex_glsl = `#version 300 es
precision highp float;
layout(location=1) in float m;layout(location=2) in vec4 i;uniform mat4 t;out float f;void main(){gl_Position=t*i;f=m;}`;

export const fragment_glsl = `#version 300 es
precision highp float;
in vec2 l;in float f;in vec3 n;in mat4 o;in vec4 u;in vec3 e,d;uniform mediump sampler2DArray s;uniform mediump sampler2DShadow z;uniform mediump sampler2D h;vec3 x=normalize(vec3(-.3,.5,-.2));vec4 y=vec4(.2,.2,.2,1);vec2 a=vec2(-150,0),A=vec2(300,1500);out vec4 g;float p(mediump sampler2DShadow v,vec4 f){float i=0.,n=1./4096.;for(int l=-1;l<=1;l++)for(int m=-1;m<=1;m++){vec2 e=vec2(l,m)*n;i+=texture(v,vec3(f.xy+e,f.z-.003));}return i/9.;}float p(float v,float f,float i){return 2.*f/(i+f-v*(i-f));}float p(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}float r(vec2 v){vec2 f=floor(v),n=fract(v);n=n*n*(3.-2.*n);return mix(mix(p(f),p(f+vec2(1,0)),n.x),mix(p(f+vec2(0,1)),p(f+1.),n.x),n.y);}void main(){float v=p(z,u*.5+.5);vec3 m=normalize(mat3(o)*n);float i=max(dot(x,m),0.),t=f<2.?1.:mix(.2*i,i,v);vec3 c=t*vec3(1),C=c+y.xyz,D=clamp(C,vec3(.3),vec3(1));float w=r(d.xz*2.)-.5,B=distance(d.xz,e.xz);vec2 E=(d.xz-a)/A;float F=texture(h,E).x,G=max(B<10.5+w?1.:0.,F),H=1.-abs(G*2.-1.),I=f<2.?1.:smoothstep(.35,.65,G+w*.35*H);vec4 J=texture(s,vec3(l,f));float K=dot(J,vec4(.299,.587,.114,1));K=(K-.5)*.55+.5;vec3 L=vec3(K);L*=.4;L=mix(L,vec3(.45),.2);vec3 M=mix(L,J.xyz,I),N=M.xyz*D;float O=p(gl_FragCoord.z,1.,3e2),P=smoothstep(.8,1.,O),Q=dot(N,vec3(.299,.587,.114));vec3 R=mix(vec3(Q),N,I);g=vec4(R,J.w-P);if(J.w<.2)discard;}`;

export const particle_fragment_glsl = `#version 300 es
precision highp float;
in float L,f;out vec4 K;uniform mediump sampler2DArray s;void main(){vec4 v=texture(s,vec3(gl_PointCoord,f));float i=v.w*L;if(i<.01)discard;K=vec4(v.xyz,i);}`;

export const particle_vertex_glsl = `#version 300 es
layout(location=0) in vec3 i;layout(location=1) in float c;layout(location=2) in float M;layout(location=3) in float m;uniform mat4 w;out float L,f;void main(){gl_Position=w*vec4(i,1);gl_PointSize=c;L=M;f=m;}`;

export const skybox_fragment_glsl = `#version 300 es
precision highp float;
uniform mediump sampler2DArray s;uniform mat4 D;uniform float I,N,E;in vec4 F;out vec4 g;void main(){vec4 v=D*F;vec3 f=normalize(v.xyz/v.w);float m=atan(f.x,f.z),n=asin(clamp(f.y,-1.,1.));vec2 i;i.x=m/6.28+.5;i.y=n/3.14+.5;vec4 l=texture(s,vec3(i,N)),L=texture(s,vec3(i,E));g=mix(l,L,I);}`;

export const skybox_vertex_glsl = `#version 300 es
layout(location=0) in vec4 i;out vec4 F;void main(){F=i;gl_Position=i;gl_Position.z=1.;}`;

export const vertex_glsl = `#version 300 es
layout(location=0) in vec2 J;layout(location=1) in float m;layout(location=2) in vec3 i;layout(location=3) in vec3 R;layout(location=4) in vec3 C;layout(location=5) in vec3 B;layout(location=6) in vec3 O;layout(location=7) in vec3 G;layout(location=8) in vec3 H;layout(location=9) in vec3 P;uniform vec3 Q;uniform mat4 S,T,t,U;uniform float V;uniform int W,X;vec4 Y[4];vec3 Z[4];out vec2 l;out float f;out vec3 n;out mat4 o;out vec4 u;out vec3 e,d;void main(){Y[0]=vec4(i,1);Y[1]=vec4(R,1);Y[2]=vec4(C,1);Y[3]=vec4(B,1);Z[0]=O;Z[1]=G;Z[2]=H;Z[3]=P;vec4 v=mix(Y[W],Y[X],V);gl_Position=S*v;l=J;f=m;n=mix(Z[W],Z[X],V);o=T;u=t*v;e=Q;d=(U*v).xyz;}`;

