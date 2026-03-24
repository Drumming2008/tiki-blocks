in vec3 a_pos;

uniform mat4 u_viewMat;
uniform mat4 u_projectionMat;

void main() {
    gl_PointSize = 4.0;

    gl_Position = u_projectionMat * u_viewMat * vec4(a_pos, 1);
}
