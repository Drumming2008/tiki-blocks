#include world.fsh

in vec3 v_texPos;
in float v_brightness;

uniform lowp sampler2DArray u_tex;

out vec4 outColor;

void main() {
    vec4 color = texture(u_tex, v_texPos);
    if (color.a == 0.0) discard;

    color.rgb *= v_brightness;
    outColor = mixFog(color);
}
