const { mat4, glMatrix } = window.glMatrix

const debugElem = document.getElementById("debug")
let showDebug = false

let camera = { x: -4, y: 100, z: 27, yaw: glMatrix.toRadian(325), pitch: glMatrix.toRadian(25) }

let paused = true, waitingToLock = false

function pause() {
  paused = true
  id("pause-menu").style.display = ""
  id("hud").style.display = "none"
}

function unpause() {
  enterPointerLock()
}

function enterPointerLock() {
  canvas.requestPointerLock().then(() => {
    paused = false
    id("pause-menu").style.display = "none"
    id("hud").style.display = ""
  })
  .catch(error => {
    console.error(error)
  })
}

function togglePause() {
  enterPointerLock()
  if (paused) {
    unpause()
  } else pause()
}

id("resume").onclick = () => {
  unpause()
}

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement) {
    unpause()
  } else {
    pause()
  }
})

onblur = pause

let sensitivity = 0.005

onmousemove = e => {
  if (document.pointerLockElement) {
    camera.pitch += e.movementY * sensitivity
    camera.yaw += e.movementX * sensitivity
  }
}

let keybinds = [
  {
    default: "w",
    desc: "Walk Forward"
  },
  {
    default: "s",
    desc: "Walk Backward"
  },
  {
    default: "a",
    desc: "Walk Left"
  },
  {
    default: "d",
    desc: "Walk Right"
  },
  {
    default: " ",
    desc: "Jump"
  }
]

let keysDown = {}
onkeydown = e => {
  if (!e.metaKey) keysDown[e.code] = "press"

  if (e.code == "Escape") {
    e.preventDefault()
    console.log("SDLKJFHLKSJDHFLKJSDH")
    togglePause()
  }
}

onkeyup = e => {
  keysDown[e.code] = false
}

function processKeys() {
  const MOVE_SPEED = 0.5

  camera.pitch = clamp(camera.pitch, -Math.PI / 2, Math.PI / 2)
  camera.yaw %= 2 * Math.PI
  while (camera.yaw < 0) camera.yaw += 2 * Math.PI

  if (keysDown.Space) camera.y += MOVE_SPEED
  if (keysDown.ShiftLeft) camera.y -= MOVE_SPEED

  let fwd = 0, right = 0
  if (keysDown.KeyW) fwd++
  if (keysDown.KeyS) fwd--
  if (keysDown.KeyD) right++
  if (keysDown.KeyA) right--

  fwd *= MOVE_SPEED
  right *= MOVE_SPEED

  let sin = Math.sin(camera.yaw), cos = Math.cos(camera.yaw)
  camera.x += right * cos + fwd * sin
  camera.z += right * sin - fwd * cos

  if (keysDown.Backquote === "press") {
    debugElem.classList.toggle("show", showDebug = !showDebug)
  }

  for (let i in keysDown) {
    keysDown[i] &&= true
  }
}

function setup() {
  useProgram(programs.block)

  gl.bindBuffer(gl.ARRAY_BUFFER, programs.block.buffer.a_corner)
  gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([0, 1, 2, 3]), gl.STATIC_DRAW)
  gl.vertexAttribDivisor(programs.block.attrib.a_data, 1)
}

const viewMat = mat4.create()

function setProjectionMatrices(program) {
  gl.uniformMatrix4fv(program.uniform.u_projectionMat, false, projectionMat)
  gl.uniformMatrix4fv(program.uniform.u_viewMat, false, viewMat)
}

let lastFrameTimes = []

function draw() {
  let now = performance.now()
  while (now - lastFrameTimes[0] >= 1000) lastFrameTimes.shift()
  lastFrameTimes.push(now)

  if (showDebug) {
    let camX = Math.floor(camera.x), camY = Math.floor(camera.y), camZ = Math.floor(camera.z)
    let blockId = getBlockIdAt(camX, camY, camZ)

    debugElem.innerText = [
      `${lastFrameTimes.length} FPS`,
      "",
      `Pos: ${camera.x.toFixed(2)}, ${camera.y.toFixed(4)}, ${camera.z.toFixed(2)} (Block: ${camX}, ${camY}, ${camZ})`,
      `Yaw: ${glMatrix.toDegree(camera.yaw).toFixed(1)}, Pitch: ${glMatrix.toDegree(camera.pitch).toFixed(1)}`,
      "",
      `Chunks: ${loadedChunks.size} loaded, ${chunks.size} total`,
      `Chunk: ${getChunkPos(camX, camZ).join(", ")} (Pos in chunk: ${wrapPosToChunkSize(camX, camY, camZ).join(", ")})`,
      "",
      `Block: ${blockId !== null ? blocksById[blockId].name : "<none>"}`
    ].join("\n")
  }

  loadedChunks.clear()
  loadChunksAround(camera.x, camera.z, renderDistance)

  clearCanvas()

  mat4.fromXRotation(viewMat, camera.pitch)
  mat4.rotateY(viewMat, viewMat, camera.yaw)
  mat4.translate(viewMat, viewMat, [-camera.x, -camera.y, -camera.z])

  useProgram(programs.block)
  useTexture(programs.block.uniform.u_tex, blockTexture, 0, gl.TEXTURE_2D_ARRAY)

  setProjectionMatrices(programs.block)
  gl.uniform3f(programs.block.uniform.u_cameraPos, camera.x, camera.y, camera.z)
  gl.uniform1f(programs.block.uniform.u_renderDistance, renderDistance * CHUNK_SIZE)

  drawChunks()

  if (showDebug) {
    let [chunkX, chunkZ] = getChunkPos(camera.x, camera.z), points

    useProgram(programs.project)
    setProjectionMatrices(programs.project)
    gl.bindBuffer(gl.ARRAY_BUFFER, programs.project.buffer.a_pos)

    points = []
    for (let y = 0; y <= CHUNK_HEIGHT; y += 4) {
      let x = chunkX * CHUNK_SIZE, z = chunkZ * CHUNK_SIZE
      let x2 = x + CHUNK_SIZE, z2 = z + CHUNK_SIZE
      points.push(
        x, y, z, x2, y, z,
        x2, y, z, x2, y, z2,
        x2, y, z2, x, y, z2,
        x, y, z2, x, y, z
      )
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW)
    gl.uniform4f(programs.project.uniform.u_color, 1, 1, 0, 1)
    gl.drawArrays(gl.LINES, 0, points.length / 3)

    points = []
    for (let dx = -1; dx <= 2; dx++) {
      for (let dz = -1; dz <= 2; dz++) {
        let x = (chunkX + dx) * CHUNK_SIZE, z = (chunkZ + dz) * CHUNK_SIZE
        points.push(x, 0, z, x, CHUNK_HEIGHT, z)
      }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW)
    gl.uniform4f(programs.project.uniform.u_color, 1, 0, 0, 1)
    gl.drawArrays(gl.LINES, 0, points.length / 3)
  }
}

function loaded() {
  setup()
  setInterval(() => {
    processKeys()
    draw()
  }, 1000 / 60)
}

let itemsToLoad = 0, itemsLoaded = 0

function itemLoaded() {
  if (++itemsLoaded === itemsToLoad) {
    console.log("loaded!")
    loaded()
  } else {
    console.log(`loading... ${itemsLoaded}/${itemsToLoad}`)
  }
}

function waitForLoad(promise = null) {
  itemsToLoad++
  promise?.then(itemLoaded)
}

waitForLoad()
onload = itemLoaded
