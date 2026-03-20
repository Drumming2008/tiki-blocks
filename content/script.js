let canvas = document.querySelector("canvas"), gl = canvas.getContext("webgl2")

function resizeCanvas() {
  canvas.width = innerWidth * devicePixelRatio
  canvas.height = innerHeight * devicePixelRatio
}

resizeCanvas()

onresize = () => {
  resizeCanvas()
}
