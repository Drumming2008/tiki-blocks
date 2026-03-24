#define SKY_COLOR vec3(0.714, 0.835, 0.961)

in vec3 v_texPos;
in float v_brightness;
in float v_fog;

uniform lowp sampler2DArray u_tex;

out vec4 outColor;

void main() {
    outColor = texture(u_tex, v_texPos);
    if (outColor.a == 0.0) discard;
    outColor.rgb = mix(outColor.rgb * v_brightness, SKY_COLOR, v_fog);
}
