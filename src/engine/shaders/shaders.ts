// Generated with Shader Minifier 1.3.4 (https://github.com/laurentlb/Shader_Minifier/)
export const aCoords = 'i';
export const aCoords1 = 'K';
export const aCoords2 = 'S';
export const aCoords3 = 'C';
export const aDepth = 'm';
export const aLife = 'N';
export const aNormal = 'P';
export const aNormal1 = 'E';
export const aNormal2 = 'H';
export const aNormal3 = 'I';
export const aSize = 'A';
export const aTexCoord = 'G';
export const alpha = 'V';
export const fragColor = 'L';
export const fragDepth = 'v';
export const frameA = 'W';
export const frameB = 'X';
export const fromIndex = 'O';
export const lightPovMvp = 't';
export const modelviewProjection = 'R';
export const normalMatrix = 'T';
export const outColor = 'g';
export const playerPosition = 'Q';
export const positionFromLightPov = 'u';
export const shadowMap = 's';
export const toBlend = 'J';
export const toIndex = 'D';
export const uSampler = 'z';
export const uViewProj = 'w';
export const u_viewDirectionProjectionInverse = 'B';
export const vDepth = 'f';
export const vLife = 'M';
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
out float v;in float f;void main(){if(f<2.f)discard;v=gl_FragCoord.z;}`;

export const depth_vertex_glsl = `#version 300 es
precision highp float;
layout(location=1) in float m;layout(location=2) in vec4 i;uniform mat4 t;out float f;void main(){gl_Position=t*i;f=m;}`;

export const fragment_glsl = `#version 300 es
precision highp float;
in vec2 l;in float f;in vec3 n;in mat4 o;in vec4 u;in vec3 e,d;uniform mediump sampler2DArray z;uniform mediump sampler2DShadow s;uniform mediump sampler2D h;vec3 x=normalize(vec3(-.3,.5,-.2));vec4 y=vec4(.2,.2,.2,1);vec2 a=vec2(-150,0),c=vec2(300,1500);out vec4 g;float p(mediump sampler2DShadow v,vec4 f){float i=0.,n=1./4096.;for(int l=-1;l<=1;l++)for(int m=-1;m<=1;m++){vec2 z=vec2(l,m)*n;i+=texture(v,vec3(f.xy+z,f.z));}return i/9.;}float p(float v,float f,float i){return 2.*f/(i+f-v*(i-f));}float p(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}float r(vec2 v){vec2 f=floor(v),n=fract(v);n=n*n*(3.-2.*n);return mix(mix(p(f),p(f+vec2(1,0)),n.x),mix(p(f+vec2(0,1)),p(f+1.),n.x),n.y);}void main(){vec4 v=u*.5+.5;float m=any(notEqual(v.xyz,clamp(v.xyz,0.,1.)))?1.:p(s,v);vec3 i=normalize(mat3(o)*n);float t=max(dot(x,i),0.),w=f<2.?1.:mix(.2*t,t,m);vec3 A=w*vec3(1),C=A+y.xyz,D=clamp(C,vec3(.3),vec3(1));float B=r(d.xz*2.)-.5,E=distance(d.xz,e.xz);vec2 F=(d.xz-a)/c;float G=texture(h,F).x,H=max(E<10.5+B?1.:0.,G),I=1.-abs(H*2.-1.),J=f<2.?1.:smoothstep(.35,.65,H+B*.35*I);vec4 K=texture(z,vec3(l,f));float L=dot(K,vec4(.299,.587,.114,1));L=(L-.5)*.55+.5;vec3 M=vec3(L);M*=.4;M=mix(M,vec3(.45),.9);vec3 N=mix(M,K.xyz,J),O=N.xyz*D;float P=p(gl_FragCoord.z,1.,3e2),Q=smoothstep(.8,1.,P),R=dot(O,vec3(.299,.587,.114));vec3 S=mix(vec3(R),O,J);g=vec4(S,K.w-Q);if(K.w<.2)discard;}`;

export const particle_fragment_glsl = `#version 300 es
precision highp float;
in float M,f;out vec4 L;uniform mediump sampler2DArray z;void main(){vec4 v=texture(z,vec3(gl_PointCoord,f));float i=v.w*M;if(i<.01)discard;L=vec4(v.xyz,i);}`;

export const particle_vertex_glsl = `#version 300 es
layout(location=0) in vec3 i;layout(location=1) in float A;layout(location=2) in float N;layout(location=3) in float m;uniform mat4 w;out float M,f;void main(){gl_Position=w*vec4(i,1);gl_PointSize=A;M=N;f=m;}`;

export const skybox_fragment_glsl = `#version 300 es
precision highp float;
uniform mediump sampler2DArray z;uniform mat4 B;uniform float J,O,D;in vec4 F;out vec4 g;void main(){vec4 v=B*F;vec3 f=normalize(v.xyz/v.w);float m=atan(f.x,f.z),n=asin(clamp(f.y,-1.,1.));vec2 i;i.x=m/6.28+.5;i.y=n/3.14+.5;vec4 l=texture(z,vec3(i,O)),M=texture(z,vec3(i,D));g=mix(l,M,J);}`;

export const skybox_vertex_glsl = `#version 300 es
layout(location=0) in vec4 i;out vec4 F;void main(){F=i;gl_Position=i;gl_Position.z=1.;}`;

export const vertex_glsl = `#version 300 es
layout(location=0) in vec2 G;layout(location=1) in float m;layout(location=2) in vec3 i;layout(location=3) in vec3 K;layout(location=4) in vec3 S;layout(location=5) in vec3 C;layout(location=6) in vec3 P;layout(location=7) in vec3 E;layout(location=8) in vec3 H;layout(location=9) in vec3 I;uniform vec3 Q;uniform mat4 R,T,t,U;uniform float V;uniform int W,X;vec4 Y[4];vec3 Z[4];out vec2 l;out float f;out vec3 n;out mat4 o;out vec4 u;out vec3 e,d;void main(){Y[0]=vec4(i,1);Y[1]=vec4(K,1);Y[2]=vec4(S,1);Y[3]=vec4(C,1);Z[0]=P;Z[1]=E;Z[2]=H;Z[3]=I;vec4 v=mix(Y[W],Y[X],V);gl_Position=R*v;l=G;f=m;n=mix(Z[W],Z[X],V);o=T;u=t*v;e=Q;d=(U*v).xyz;}`;

