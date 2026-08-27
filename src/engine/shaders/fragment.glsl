#version 300 es

//[
precision highp float;
//]
in vec2 vTexCoord;
in float vDepth;
in vec3 vNormal;
in mat4 vNormalMatrix;
in vec4 positionFromLightPov;
in vec3 vPlayerPosition;
in vec3 vWorldPosition;

uniform mediump sampler2DArray uSampler;
uniform mediump sampler2DShadow shadowMap;
uniform mediump sampler2D worldReveal;

vec3 lightDirection = normalize(vec3(-0.3, 0.5, -0.2));
vec4 ambientLight = vec4(0.2, 0.2, 0.2, 1.0);

vec2 worldMin = vec2(-150, 0);
vec2 worldSize = vec2(300, 2100);

out vec4 outColor;

float sampleShadowPCF(mediump sampler2DShadow shadowMap, vec4 shadowCoord) {
    float shadow = 0.0;
    float texelSize = 1.0 / 4096.0; // match your shadow map resolution

    // 3x3 PCF kernel
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(x, y) * texelSize;
            shadow += texture(shadowMap, vec3(shadowCoord.xy + offset, shadowCoord.z - 0.001));
        }
    }

    return shadow / 9.0; // average result
}

float linearizeDepth(float z, float near, float far) {
    return (2.0 * near) / (far + near - z * (far - near));
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);

    return mix(
        mix(hash(i), hash(i+vec2(1,0)), f.x),
        mix(hash(i+vec2(0,1)), hash(i+1.0), f.x),
        f.y
    );
}

void main() {
    // === Shadow sampling ===
    float shadowFactor = sampleShadowPCF(shadowMap, positionFromLightPov * 0.5 + 0.5);
    // 1.0 = fully lit, 0.0 = fully shadowed

    // === Normalized inputs ===
    vec3 normal = normalize(mat3(vNormalMatrix) * vNormal);

    // === Basic diffuse ===
    float NdotL = max(dot(lightDirection, normal), 0.0);

    // Instead of killing diffuse in shadow, scale it down
    // Obviously a hack for emissive, but any texture past the 14th is full lit
    float shadowedDiffuse = mix(0.2 * NdotL, NdotL, shadowFactor);

    // === Lighting ===
    vec3 diffuseColor = shadowedDiffuse * vec3(1.0); // white light
    vec3 litColor = diffuseColor + ambientLight.rgb;

    // Clamp to [ambient .. 1] range
    vec3 finalLighting = clamp(litColor, vec3(0.3, 0.3, 0.3), vec3(1.0));

    // new world color reveal logic
    float n = noise(vWorldPosition.xz * 2.0) - .5;

    float revealRadius = 10.5; // TODO: Pass in as uniform
    float d = distance(vWorldPosition.xz, vPlayerPosition.xz);

    // Noise changes the shape of the circle
    float playerReveal = d < revealRadius + n ? 1.0 : 0.0;//    float playerReveal = distance(worldPos.xz, playerPos.xz) < revealRadius ? 1.0 : 0.0;
    vec2 uv = (vWorldPosition.xz - worldMin) / worldSize;
    float worldMask = texture(worldReveal, uv).r;
    float mask = max(playerReveal, worldMask);
    float boundary = 1.0 - abs(mask * 2.0 - 1.0);
    float noisyMask = mask + n * .35 * boundary;
    float revealed = smoothstep(.35, .65, noisyMask);
//    float revealed = max(mapReveal, playerReveal);

    // === Texture sample ===
    vec4 baseColor = texture(uSampler, vec3(vTexCoord, vDepth));
    float grayTexture = dot(baseColor, vec4(.299, .587, .114, 1.0));
    grayTexture = (grayTexture - .5) * .55 + .5;
    vec3 deadAlbedo = vec3(grayTexture);
    deadAlbedo *= 0.4;
    deadAlbedo = mix(deadAlbedo, vec3(.45), .2);
    vec3 materialColor = mix(deadAlbedo, baseColor.rgb, revealed);


    vec3 shadedColor = materialColor.rgb * finalLighting;

    // === Fog ===
    float depth = linearizeDepth(gl_FragCoord.z, 1.0, 300.0);
    // Fog ramps from near → far, capped so it never fully grays out
    float fogFactor = smoothstep(0.4, 1.0, depth);

    vec3 fogColor = vec3(0.7, 0.9, 0.5);
    vec3 foggedColor = mix(shadedColor, fogColor, fogFactor);


    // === Final output ===
    // outColor = vec4(foggedColor, baseColor.a);
    float gray = dot(foggedColor, vec3(.299, .587, .114));
    vec3 grayedMixColor = mix(vec3(gray), foggedColor, revealed);
    outColor = vec4(grayedMixColor, baseColor.a);

    if (outColor.a < 0.2) {
        discard;
    }
}

