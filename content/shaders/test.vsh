in vec2 a_pos;
in vec2 a_texPos;

out vec2 v_texPos;

void main() {
    gl_Position = vec4((a_pos - 0.5) * vec2(2, -2), 0, 1);
    v_texPos = a_texPos;
}
