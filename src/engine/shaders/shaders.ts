// Generated with Shader Minifier 1.3.4 (https://github.com/laurentlb/Shader_Minifier/)
export const aCoords = 'i';
export const aCoords1 = 'J';
export const aCoords2 = 'S';
export const aCoords3 = 'M';
export const aDepth = 'm';
export const aLife = 'c';
export const aNormal = 'N';
export const aNormal1 = 'P';
export const aNormal2 = 'R';
export const aNormal3 = 'D';
export const aSize = 'a';
export const aTexCoord = 'F';
export const alpha = 'V';
export const fragColor = 'K';
export const fragDepth = 'v';
export const frameA = 'W';
export const frameB = 'X';
export const fromIndex = 'Q';
export const lightPovMvp = 't';
export const modelviewProjection = 'H';
export const normalMatrix = 'T';
export const outColor = 'g';
export const playerPosition = 'G';
export const positionFromLightPov = 'u';
export const shadowMap = 'z';
export const toBlend = 'I';
export const toIndex = 'O';
export const uSampler = 's';
export const uViewProj = 'B';
export const u_viewDirectionProjectionInverse = 'E';
export const vDepth = 'f';
export const vLife = 'L';
export const vNormal = 'n';
export const vNormalMatrix = 'o';
export const vPlayerPosition = 'e';
export const vTexCoord = 'l';
export const vWorldPosition = 'd';
export const v_position = 'C';
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
in vec2 l;in float f;in vec3 n;in mat4 o;in vec4 u;in vec3 e,d;uniform mediump sampler2DArray s;uniform mediump sampler2DShadow z;uniform mediump sampler2D h;vec3 x=normalize(vec3(-.3,.5,-.2));vec4 y=vec4(.2,.2,.2,1);vec2 w=vec2(-150,0),A=vec2(300,1200);out vec4 g;float p(mediump sampler2DShadow v,vec4 f){float i=0.,n=1./4096.;for(int l=-1;l<=1;l++)for(int m=-1;m<=1;m++){vec2 e=vec2(l,m)*n;i+=texture(v,vec3(f.xy+e,f.z-.002));}return i/9.;}float p(float v,float f,float i){return 2.*f/(i+f-v*(i-f));}float p(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}float r(vec2 v){vec2 f=floor(v),n=fract(v);n=n*n*(3.-2.*n);return mix(mix(p(f),p(f+vec2(1,0)),n.x),mix(p(f+vec2(0,1)),p(f+1.),n.x),n.y);}void main(){float v=p(z,u);vec3 m=normalize(mat3(o)*n);float i=max(dot(x,m),0.),t=mix(.2*i,i,v);vec3 a=t*vec3(1),c=a+y.xyz,C=clamp(c,vec3(.3),vec3(1));float B=r(d.xz*2.)-.5,D=distance(d.xz,e.xz);vec2 E=(d.xz-w)/A;float F=texture(h,E).x,G=max(D<10.5+B?1.:0.,F),H=1.-abs(G*2.-1.),I=smoothstep(.35,.65,G+B*.35*H);vec4 J=texture(s,vec3(l,f));float K=dot(J,vec4(.299,.587,.114,1));K=(K-.5)*.55+.5;vec3 L=vec3(K);L*=.4;L=mix(L,vec3(.45),.2);vec3 M=mix(L,J.xyz,I);float N=p(gl_FragCoord.z,1.,7e2),O=clamp(smoothstep(.4,1.,N),0.,.5);vec3 P=vec3(.3,.3,.5),Q=mix(M.xyz*C,P,O);float R=dot(Q,vec3(.299,.587,.114));vec3 S=mix(vec3(R),Q,I);g=vec4(S,J.w);if(g.w<.2)discard;}`;

export const particle_fragment_glsl = `#version 300 es
precision highp float;
in float L,f;out vec4 K;uniform mediump sampler2DArray s;void main(){vec4 v=texture(s,vec3(gl_PointCoord,f));float i=v.w*L;if(i<.01)discard;K=vec4(v.xyz,i);}`;

export const particle_vertex_glsl = `#version 300 es
layout(location=0) in vec3 i;layout(location=1) in float a;layout(location=2) in float c;layout(location=3) in float m;uniform mat4 B;out float L,f;void main(){gl_Position=B*vec4(i,1);gl_PointSize=a;L=c;f=m;}`;

export const skybox_fragment_glsl = `#version 300 es
precision highp float;
uniform mediump sampler2DArray s;uniform mat4 E;uniform float I,Q,O;in vec4 C;out vec4 g;void main(){vec4 v=E*C;vec3 f=normalize(v.xyz/v.w);float m=atan(f.x,f.z),n=asin(clamp(f.y,-1.,1.));vec2 i;i.x=m/6.28+.5;i.y=n/3.14+.5;vec4 l=texture(s,vec3(i,Q)),L=texture(s,vec3(i,O));g=mix(l,L,I);}`;

export const skybox_vertex_glsl = `#version 300 es
layout(location=0) in vec4 i;out vec4 C;void main(){C=i;gl_Position=i;gl_Position.z=1.;}`;

export const vertex_glsl = `#version 300 es
layout(location=0) in vec2 F;layout(location=1) in float m;layout(location=2) in vec3 i;layout(location=3) in vec3 J;layout(location=4) in vec3 S;layout(location=5) in vec3 M;layout(location=6) in vec3 N;layout(location=7) in vec3 P;layout(location=8) in vec3 R;layout(location=9) in vec3 D;uniform vec3 G;uniform mat4 H,T,t,U;uniform float V;uniform int W,X;vec4 Y[4];vec3 Z[4];out vec2 l;out float f;out vec3 n;out mat4 o;out vec4 u;out vec3 e,d;void main(){Y[0]=vec4(i,1);Y[1]=vec4(J,1);Y[2]=vec4(S,1);Y[3]=vec4(M,1);Z[0]=N;Z[1]=P;Z[2]=R;Z[3]=D;vec4 v=mix(Y[W],Y[X],V);gl_Position=H*v;l=F;f=m;n=mix(Z[W],Z[X],V);o=T;u=t*v;e=G;d=(U*v).xyz;}`;

