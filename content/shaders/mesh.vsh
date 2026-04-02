/*
mesh face data packing:

tttttttt 000000zz zzzxxxxx yyyyyyyy    00000ddd dzdzdxdx dydyZZZZ XXXXYYYY

y/x/z = coarse position
t = texture index

Y/X/Z = fine position (16ths)
dy/dx/dz = size
d = size mask
*/

#include world.vsh

in int a_data1;
in int a_data2;
in int a_corner;

out vec3 v_texPos;
out float v_brightness;

void main() {
    int data = a_data;

    int y    = data & 255; data >>= 8;
    int x    = data & 31;  data >>= 5;
    int z    = data & 31;  data >>= 11;
    int tex  = data & 255;

    vec3 pos = vec3(x + u_offset.x, y, z + u_offset.y);

    v_texPos = vec3(0, 0, tex); // TODO
    v_brightness = 1; // TODO

    setPos(pos);
    setFog(pos);
}
