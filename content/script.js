function draw() {
  clearCanvas()

  useProgram(programs.test)

  gl.bindBuffer(gl.ARRAY_BUFFER, programs.test.buffer.a_pos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.3, 0.3, 0.7, 0.3, 0.3, 0.7, 0.7, 0.7]), gl.DYNAMIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, programs.test.buffer.a_texPos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.DYNAMIC_DRAW)

  useTexture(programs.test.uniform.u_tex, textures.blocks.stone_bricks, 0)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function loaded() {
  setInterval(draw, 1000 / 60)
}

let itemsToLoad = 0, itemsLoaded = 0

function waitForLoad(promise) {
  itemsToLoad++

  promise.then(() => {
    if (++itemsLoaded === itemsToLoad) {
      loaded()
    }
  })
}
