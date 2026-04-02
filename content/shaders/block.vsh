/*
block face data packing:

tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

y/x/z = position
f = face [+y, -y, +x, -x, +z, -z]
r = texture rotation (ccw)
t = texture index
*/

#include world.vsh

const float[] FACE_BRIGHTNESS = float[](
    1.0, 0.55, 0.8, 0.8, 0.65, 0.65
);

in int a_data;
in int a_corner;

out vec3 v_texPos;
out float v_brightness;

void main() {
    int data = a_data;

    int y    = data & 255; data >>= 8;
    int x    = data & 31;  data >>= 5;
    int z    = data & 31;  data >>= 5;
    int face = data & 7;   data >>= 3;
    int rot  = data & 3;   data >>= 3;
    int tex  = data & 255;

    ivec3 pos = ivec3(x + u_offset.x, y, z + u_offset.y);
    ivec3 cornerOffset = ivec3(a_corner & 1, a_corner >> 1, 1);

    if (face == 0) {
        pos += cornerOffset.yzx;
    } else if (face == 1) {
        pos.xz += cornerOffset.xy;
    } else if (face == 2) {
        pos.z += 1 - cornerOffset.x;
        pos.xy += cornerOffset.zy;
    } else if (face == 3) {
        pos.yz += cornerOffset.yx;
    } else if (face == 4) {
        pos += cornerOffset;
    } else if (face == 5) {
        pos.x += 1 - cornerOffset.x;
        pos.y += cornerOffset.y;
    }

    int texCorner = (a_corner ^ (a_corner >> 1)) + rot;
    int texY = (texCorner >> 1) & 1;
    v_texPos = vec3((texCorner & 1) ^ texY, 1 - texY, tex);

    v_brightness = FACE_BRIGHTNESS[face];

    setPos(pos);
    setFog(pos);
}
