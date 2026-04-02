uniform vec3 u_cameraPos;
uniform ivec2 u_offset;
uniform float u_renderDistance;

uniform mat4 u_viewMat;
uniform mat4 u_projectionMat;

out float v_fog;

void setPos(vec3 pos) {
    gl_Position = u_projectionMat * u_viewMat * vec4(pos, 1);
}
void setPos(ivec3 pos) {
    gl_Position = u_projectionMat * u_viewMat * vec4(pos, 1);
}

void setFog(vec3 pos) {
    float dist = distance(pos, u_cameraPos);
    v_fog = smoothstep(0.9, 1.0, dist / u_renderDistance);
}
void setFog(ivec3 pos) {
    setFog(vec3(pos));
}
