const canvas = document.querySelector("canvas"), gl = canvas.getContext("webgl2")

let width, height

function resizeCanvas() {
  width = canvas.width = innerWidth * devicePixelRatio
  height = canvas.height = innerHeight * devicePixelRatio

  gl.viewport(0, 0, width, height)
}

resizeCanvas()
onresize = resizeCanvas
