// Generated with Shader Minifier 1.3.4 (https://github.com/laurentlb/Shader_Minifier/)
export const aCoords = 'i';
export const aCoords1 = 'O';
export const aCoords2 = 'Q';
export const aCoords3 = 'K';
export const aDepth = 'm';
export const aLife = 'c';
export const aNormal = 'L';
export const aNormal1 = 'N';
export const aNormal2 = 'P';
export const aNormal3 = 'E';
export const aSize = 'a';
export const aTexCoord = 'H';
export const alpha = 'S';
export const fragColor = 'I';
export const fragDepth = 'v';
export const frameA = 'T';
export const frameB = 'U';
export const lightPovMvp = 't';
export const modelviewProjection = 'G';
export const normalMatrix = 'M';
export const outColor = 'g';
export const playerPosition = 'F';
export const positionFromLightPov = 'u';
export const shadowMap = 'z';
export const uSampler = 's';
export const uViewProj = 'B';
export const u_viewDirectionProjectionInverse = 'D';
export const vDepth = 'f';
export const vLife = 'J';
export const vNormal = 'n';
export const vNormalMatrix = 'o';
export const vPlayerPosition = 'e';
export const vTexCoord = 'l';
export const vWorldPosition = 'd';
export const v_position = 'C';
export const worldMatrix = 'R';
export const worldReveal = 'h';

export const depth_fragment_glsl = `#version 300 es
precision highp float;
out float v;in float f;void main(){v=gl_FragCoord.z;}`;

export const depth_vertex_glsl = `#version 300 es
precision highp float;
layout(location=1) in float m;layout(location=2) in vec4 i;uniform mat4 t;out float f;void main(){gl_Position=t*i;f=m;}`;

export const fragment_glsl = `#version 300 es
precision highp float;
in vec2 l;in float f;in vec3 n;in mat4 o;in vec4 u;in vec3 e,d;uniform mediump sampler2DArray s;uniform mediump sampler2DShadow z;uniform mediump sampler2D h;vec3 x=normalize(vec3(-.3,.5,-.2));vec4 y=vec4(.2,.2,.2,1);vec2 w=vec2(-260,-267),A=vec2(536,524);out vec4 g;float p(mediump sampler2DShadow v,vec4 f){float i=0.,n=1./4096.;for(int l=-1;l<=1;l++)for(int m=-1;m<=1;m++){vec2 e=vec2(l,m)*n;i+=texture(v,vec3(f.xy+e,f.z-.002));}return i/9.;}float p(float v,float i,float f){return 2.*i/(f+i-v*(f-i));}float p(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);}float r(vec2 v){vec2 f=floor(v),n=fract(v);n=n*n*(3.-2.*n);return mix(mix(p(f),p(f+vec2(1,0)),n.x),mix(p(f+vec2(0,1)),p(f+1.),n.x),n.y);}void main(){float v=p(z,u);vec3 m=normalize(mat3(o)*n);float i=max(dot(x,m),0.),t=mix(.2*i,i,v);vec3 e=t*vec3(1),c=e+y.xyz,C=clamp(c,vec3(.3),vec3(1));vec2 D=(d.xz-w)/A;float B=texture(h,D).x,E=r(d.xz*2.)-.5,F=1.-abs(B*2.-1.),G=smoothstep(.35,.65,B+E*.35*F);vec4 H=texture(s,vec3(l,f));float I=dot(H,vec4(.299,.587,.114,1));I=(I-.5)*.55+.5;vec3 J=vec3(I);J*=.4;J=mix(J,vec3(.45),.2);vec3 K=mix(J,H.xyz,G);float L=p(gl_FragCoord.z,1.,7e2),M=clamp(smoothstep(.4,1.,L),0.,.5);vec3 N=vec3(.3,.3,.5),O=mix(K.xyz*C,N,M);float P=dot(O,vec3(.299,.587,.114));vec3 Q=mix(vec3(P),O,G);g=vec4(Q,H.w);if(g.w<.2)discard;}`;

export const particle_fragment_glsl = `#version 300 es
precision highp float;
in float J,f;out vec4 I;uniform mediump sampler2DArray s;void main(){vec4 v=texture(s,vec3(gl_PointCoord,f));float m=v.w*J;if(m<.01)discard;I=vec4(v.xyz,m);}`;

export const particle_vertex_glsl = `#version 300 es
layout(location=0) in vec3 i;layout(location=1) in float a;layout(location=2) in float c;layout(location=3) in float m;uniform mat4 B;out float J,f;void main(){gl_Position=B*vec4(i,1);gl_PointSize=a;J=c;f=m;}`;

export const skybox_fragment_glsl = `#version 300 es
precision highp float;
uniform mediump sampler2D s;uniform mat4 D;in vec4 C;out vec4 g;void main(){vec4 v=D*C;vec3 f=normalize(v.xyz/v.w);float m=atan(f.x,f.z),n=asin(clamp(f.y,-1.,1.));vec2 i;i.x=m/6.28+.5;i.y=n/3.14+.5;g=texture(s,i);}`;

export const skybox_vertex_glsl = `#version 300 es
layout(location=0) in vec4 i;out vec4 C;void main(){C=i;gl_Position=i;gl_Position.z=1.;}`;

export const vertex_glsl = `#version 300 es
layout(location=0) in vec2 H;layout(location=1) in float m;layout(location=2) in vec3 i;layout(location=3) in vec3 O;layout(location=4) in vec3 Q;layout(location=5) in vec3 K;layout(location=6) in vec3 L;layout(location=7) in vec3 N;layout(location=8) in vec3 P;layout(location=9) in vec3 E;uniform vec3 F;uniform mat4 G,M,t,R;uniform float S;uniform int T,U;vec4 V[4];vec3 W[4];out vec2 l;out float f;out vec3 n;out mat4 o;out vec4 u;out vec3 e,d;void main(){V[0]=vec4(i,1);V[1]=vec4(O,1);V[2]=vec4(Q,1);V[3]=vec4(K,1);W[0]=L;W[1]=N;W[2]=P;W[3]=E;vec4 v=mix(V[T],V[U],S);gl_Position=G*v;l=H;f=m;n=mix(W[T],W[U],S);o=M;u=t*v;e=F;d=(R*v).xyz;}`;

