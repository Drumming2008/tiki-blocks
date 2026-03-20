const canvas = document.getElementById("canvas"),
      gl = canvas.getContext("webgl2")

const vs = `#version 300 es

in vec2 a_position;

out vec2 v_pos;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  
  v_pos = a_position * 1.2;
}`

const fs = `#version 300 es
 
precision highp float;

const float PI = 3.14159265;

uniform sampler2D u_image;
uniform float u_offset;

in vec2 v_pos;

out vec4 outColor;
 
void main() {
  if (abs(v_pos.x) > 1.0 || abs(v_pos.y) > 1.0) discard;

  float dist = sqrt(pow(v_pos.x, 2.0) + pow(v_pos.y, 2.0));
  
  float strength = smoothstep(0.0, 0.2, dist) * (sin((dist + u_offset) * 5.5 * PI) / 2.0 + 0.5);
  
  float angle = atan(v_pos.y, v_pos.x);
  
  vec2 texPos = v_pos + vec2(cos(angle) / 30.0 * strength, sin(angle) / 30.0 * strength);
  
  vec4 color = texture(u_image, texPos * vec2(0.5, -0.5) + 0.5);
  
  if (color.a < 0.2) color = vec4(1);

  outColor = color * sqrt(strength + 1.0);
}`

function createShader(type, source) {
  let shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    return shader

  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

function createProgram(vertexSource, fragmentSource) {
  let program = gl.createProgram()

  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource))

  gl.linkProgram(program)

  if (gl.getProgramParameter(program, gl.LINK_STATUS))
    return program

  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

let program = createProgram(vs, fs)

let positionAttributeLocation = gl.getAttribLocation(program, "a_position")

let positionBuffer = gl.createBuffer()

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
  -1,  1,
   1, -1
]), gl.STATIC_DRAW)

let vao = gl.createVertexArray()

gl.bindVertexArray(vao)

gl.enableVertexAttribArray(positionAttributeLocation)

gl.vertexAttribPointer(
  positionAttributeLocation,
  2, // size
  gl.FLOAT, // type
  false, // normalize
  0, // stride
  0 // offset
)

let offsetUniformLocation = gl.getUniformLocation(program, "u_offset")

let offset = 0

let imageLocation = gl.getUniformLocation(program, "u_image")

function draw() {
  offset -= 0.005

  updateCanvasSize()

  gl.viewport(0, 0, canvas.width, canvas.height)

  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(program)

  gl.bindVertexArray(vao)

  gl.uniform1f(offsetUniformLocation, offset)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

function updateCanvasSize() {
  canvas.width = canvas.offsetWidth * devicePixelRatio
  canvas.height = canvas.offsetHeight * devicePixelRatio
}

let image = new Image()
image.src = "./tiki-fish.png"

image.onload = () => {
  let texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0]
  ), gl.STATIC_DRAW)

  let texture = gl.createTexture()

  gl.activeTexture(gl.TEXTURE0)

  gl.bindTexture(gl.TEXTURE_2D, texture)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // mip level
    gl.RGBA, // internal format
    gl.RGBA, // src format
    gl.UNSIGNED_BYTE, // src type
    image
  )

  canvas.style.opacity = 1

  pageLoaded()
}

let loaded = 0
function pageLoaded() {
  if (++loaded === 2)
    setInterval(draw, 1000 / 60)
}

onload = pageLoaded
