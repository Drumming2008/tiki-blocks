in vec2 v_texPos;

uniform sampler2D u_tex;

out vec4 outColor;

void main() {
    outColor = texture(u_tex, v_texPos);
}
