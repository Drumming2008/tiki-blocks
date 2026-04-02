#define SKY_COLOR vec3(0.714, 0.835, 0.961)

in float v_fog;

vec4 mixFog(vec4 color) {
    return vec4(mix(color.rgb, SKY_COLOR, v_fog), color.a);
}
