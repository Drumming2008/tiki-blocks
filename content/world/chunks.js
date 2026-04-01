let chunks = new Map(), loadedChunks = new Set()

const seed = (Math.random() * 0x100000000) ^ Date.now()
console.log("SEED:", seed)

class Chunk {
  static blockIndex(x, y, z) {
    return x + z * CHUNK_SIZE + y * CHUNK_LAYER_LEN
  }

  static layerIndex(x, z) {
    return x + z * CHUNK_SIZE
  }

  constructor(x, z, data = null) {
    this.x = x
    this.z = z
    this.worldX = x * CHUNK_SIZE
    this.worldZ = z * CHUNK_SIZE
    this.key = chunkKey(x, z)

    if (data) {
      this.setData(data)
      this.generating = false
    } else {
      this.generating = true
    }
  }

  setData({ blocks, heightmap, faces, time }) {
    this.blocks = blocks
    this.heightmap = heightmap
    // jsdoc jumpscare
    /** @type {{ posData: Int32Array, negData: Int32Array, posBuffer: WebGLBuffer, negBuffer: WebGLBuffer, lengths: { pos: { x: number, y: number, z: number, padding: number }, neg: { x: number, y: number, z: number, padding: number } } }} */
    this.faces = faces
    this.maxBlockHeight = Math.floor(blocks.length / CHUNK_LAYER_LEN)

    this.timing = { gen: time, mesh: faces.time }

    this.generating = false
  }

  sampleHeightmap(x, z) {
    return this.heightmap[Chunk.layerIndex(x, z)]
  }

  getBlock(x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x >= CHUNK_SIZE || y >= CHUNK_HEIGHT || z >= CHUNK_SIZE) {
      return null
    }
    return y > this.maxBlockHeight ? Block.AIR : this.blocks[Chunk.blockIndex(x, y, z)]
  }

  getBlockWorld(x, y, z) {
    return this.getBlock(x - this.worldX, y, z - this.worldZ)
  }
}

function getChunk(x, z, includeGenerating = false) {
  let chunk = chunks.get(chunkKey(x, z))
  if (chunk?.generating && !includeGenerating) return null
  return chunk || null
}

function getChunkPos(x, z) {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)]
}

let workers = Array.from({ length: 4 }, () => {
  let { promise, resolve } = Promise.withResolvers()

  let worker = new Worker("./generation/main.js")
  let workerData = { worker, tasks: 0, loadingPromise: promise }

  worker.postMessage({ type: "setup", data: { blockTextureIndices, seed } })

  worker.onmessage = () => {
    resolve()
    workerData.loadingPromise = null
    worker.onmessage = receiveMessage
  }

  return workerData
})

function loadChunksAround(centerX, centerZ, renderDist) {
  centerX /= CHUNK_SIZE
  centerZ /= CHUNK_SIZE
  let chunkX = Math.floor(centerX), chunkZ = Math.floor(centerZ)

  let toLoad = []

  for (let x = chunkX - renderDist; x <= chunkX + renderDist; x++) {
    for (let z = chunkZ - renderDist; z <= chunkZ + renderDist; z++) {
      let dx = x - centerX, dz = z - centerZ
      if (dx < 0) dx = Math.min(0, dx + 1)
      if (dz < 0) dz = Math.min(0, dz + 1)
      let dist = Math.hypot(dx, dz)
      if (dist <= renderDist) {
        toLoad.push({ dist, x, z })
      }
    }
  }

  toLoad.sort((a, b) => a.dist - b.dist)

  for (let { x, z } of toLoad) {
    loadChunk(x, z)
  }
}

async function loadChunk(x, z) {
  let key = chunkKey(x, z)
  loadedChunks.add(key)

  if (chunks.has(key)) return

  let chunk = new Chunk(x, z)
  chunks.set(key, chunk)

  let data = await queueGenerateTask(x, z), { faces } = data

  faces.posBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, faces.posBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, faces.posData, gl.STATIC_DRAW)

  faces.negBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, faces.negBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, faces.negData, gl.STATIC_DRAW)

  chunk.setData(data)

  // tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

  let px = getChunk(x + 1, z), pz = getChunk(x, z + 1)
  let nx = getChunk(x - 1, z), nz = getChunk(x, z - 1)

  let pxFaces, nxFaces, pzFaces, nzFaces

  if (px) {
    pxFaces = []
    let otherFaces = []
    let blockDataX = CHUNK_SIZE - 1 << 8

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let otherBlockDataXZ = z << 13
      let blockDataXZ = blockDataX | otherBlockDataXZ

      let ownH = chunk.sampleHeightmap(CHUNK_SIZE - 1, z)
      let otherH = px.sampleHeightmap(0, z)

      for (let y = 0; y <= ownH; y++) {
        let face = blocksById[chunk.getBlock(CHUNK_SIZE - 1, y, z)].model.faces?.px
        if (!face) continue
        if (y <= otherH && blocksById[px.getBlock(0, y, z)].model.faces?.nx) continue

        pxFaces.push(blockDataXZ | y | face)
      }

      for (let y = 0; y <= otherH; y++) {
        let face = blocksById[px.getBlock(0, y, z)].model.faces?.nx
        if (!face) continue
        if (y <= ownH && blocksById[chunk.getBlock(CHUNK_SIZE - 1, y, z)].model.faces?.px) continue

        otherFaces.push(otherBlockDataXZ | y | face)
      }
    }

    addFaces(px, null, null, null, otherFaces, null, null)
  }
  if (nx) {
    nxFaces = []
    let otherFaces = []
    let otherBlockDataX = CHUNK_SIZE - 1 << 8

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let blockDataXZ = z << 13
      let otherBlockDataXZ = otherBlockDataX | blockDataXZ

      let ownH = chunk.sampleHeightmap(0, z)
      let otherH = nx.sampleHeightmap(CHUNK_SIZE - 1, z)

      for (let y = 0; y <= ownH; y++) {
        let face = blocksById[chunk.getBlock(0, y, z)].model.faces?.nx
        if (!face) continue
        if (y <= otherH && blocksById[nx.getBlock(CHUNK_SIZE - 1, y, z)].model.faces?.px) continue

        nxFaces.push(blockDataXZ | y | face)
      }

      for (let y = 0; y <= otherH; y++) {
        let face = blocksById[nx.getBlock(CHUNK_SIZE - 1, y, z)].model.faces?.px
        if (!face) continue
        if (y <= ownH && blocksById[chunk.getBlock(0, y, z)].model.faces?.nx) continue

        otherFaces.push(otherBlockDataXZ | y | face)
      }
    }

    addFaces(nx, null, null, otherFaces, null, null, null)
  }
  if (pz) {
    pzFaces = []
    let otherFaces = []
    let blockDataZ = CHUNK_SIZE - 1 << 13

    for (let x = 0; x < CHUNK_SIZE; x++) {
      let otherBlockDataXZ = x << 8
      let blockDataXZ = blockDataZ | otherBlockDataXZ

      let ownH = chunk.sampleHeightmap(x, CHUNK_SIZE - 1)
      let otherH = pz.sampleHeightmap(x, 0)

      for (let y = 0; y <= ownH; y++) {
        let face = blocksById[chunk.getBlock(x, y, CHUNK_SIZE - 1)].model.faces?.pz
        if (!face) continue
        if (y <= otherH && blocksById[pz.getBlock(x, y, 0)].model.faces?.nz) continue

        pzFaces.push(blockDataXZ | y | face)
      }

      for (let y = 0; y <= otherH; y++) {
        let face = blocksById[pz.getBlock(x, y, 0)].model.faces?.nz
        if (!face) continue
        if (y <= ownH && blocksById[chunk.getBlock(x, y, CHUNK_SIZE - 1)].model.faces?.pz) continue

        otherFaces.push(otherBlockDataXZ | y | face)
      }
    }

    addFaces(pz, null, null, null, null, null, otherFaces)
  }
  if (nz) {
    nzFaces = []
    let otherFaces = []
    let otherBlockDataZ = CHUNK_SIZE - 1 << 13

    for (let x = 0; x < CHUNK_SIZE; x++) {
      let blockDataXZ = x << 8
      let otherBlockDataXZ = otherBlockDataZ | blockDataXZ

      let ownH = chunk.sampleHeightmap(x, 0)
      let otherH = nz.sampleHeightmap(x, CHUNK_SIZE - 1)

      for (let y = 0; y <= ownH; y++) {
        let face = blocksById[chunk.getBlock(x, y, 0)].model.faces?.nz
        if (!face) continue
        if (y <= otherH && blocksById[nz.getBlock(x, y, CHUNK_SIZE - 1)].model.faces?.pz) continue

        nzFaces.push(blockDataXZ | y | face)
      }

      for (let y = 0; y <= otherH; y++) {
        let face = blocksById[nz.getBlock(x, y, CHUNK_SIZE - 1)].model.faces?.pz
        if (!face) continue
        if (y <= ownH && blocksById[chunk.getBlock(x, y, 0)].model.faces?.nz) continue

        otherFaces.push(otherBlockDataXZ | y | face)
      }
    }

    addFaces(nz, null, null, null, null, otherFaces, null)
  }

  addFaces(chunk, null, null, pxFaces, nxFaces, pzFaces, nzFaces)
}

function addFaces(chunk, py, ny, px, nx, pz, nz) {
  let { lengths, posBuffer, negBuffer, posData, negData } = chunk.faces

  chunk.faces.posData = add(px, py, pz, lengths.pos, posBuffer, posData)
  chunk.faces.negData = add(nx, ny, nz, lengths.neg, negBuffer, negData)

  function add(x, y, z, lengths, buffer, data) {
    let lx = x ? x.length : 0, ly = y ? y.length : 0, lz = z ? z.length : 0
    let lxy = lx + ly, added = lxy + lz
    if (!added) return data

    let oldXYLen = lengths.x + lengths.y, oldLen = oldXYLen + lengths.z

    if (added > lengths.padding) {
      let oldData = data
      data = new Int32Array(oldData.length - lengths.padding + added + FACE_BUFFER_PADDING)
      lengths.padding = FACE_BUFFER_PADDING
      if (ly) {
        // newX oldX oldY newY oldZ newZ
        data.set(oldData.subarray(0, oldXYLen), lx)
        if (lx) {
          data.set(x, 0)
          lengths.x += lx
        }
        data.set(y, oldXYLen + lx)
        lengths.y += ly
        if (lz) {
          data.set(z, oldLen + lxy)
          lengths.z += lz
        }
      } else {
        // newX oldX oldY oldZ newZ
        data.set(oldData, lx)
        if (lx) {
          data.set(x, 0)
          lengths.x += lx
        }
        if (lz) {
          data.set(z, oldLen + lx)
          lengths.z += lz
        }
      }
    } else {
      lengths.padding -= added
      // x12345 newX y2345 y1 newY z345 z12 newZ
      if (lz) {
        data.set(z, oldLen + lxy)
      }
      if (lxy) {
        let zLen = Math.min(lxy, lengths.z)
        data.copyWithin(oldLen + lxy - zLen, oldXYLen, oldXYLen + zLen)
        if (ly) {
          data.set(y, oldXYLen + lx)
        }
        if (lx) {
          let yLen = Math.min(lx, lengths.y)
          data.copyWithin(oldXYLen + lx - yLen, lengths.x, lengths.x + yLen)
          data.set(x, lengths.x)
          lengths.x += lx
        }
        lengths.y += ly
      }
      lengths.z += lz
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

    return data
  }
}

let messageReceivedCallbacks = new Map(), messageReceivedCallbackId = 0

async function queueGenerateTask(x, z) {
  let id = messageReceivedCallbackId++

  let worker = workers.sort((a, b) => a.tasks - b.tasks)[0]
  worker.tasks++

  if (worker.loadingPromise) await worker.loadingPromise

  return new Promise(resolve => {
    worker.worker.postMessage({ id, type: "generate", data: { x, z } })

    messageReceivedCallbacks.set(id, chunk => {
      worker.tasks--
      resolve(chunk)
    })
  })
}

function receiveMessage({ data: { id, data } }) {
  if (!messageReceivedCallbacks.has(id)) {
    console.error(`Message received from worker with unknown id '${id}'`, data)
    return
  }

  messageReceivedCallbacks.get(id)(data)
  messageReceivedCallbacks.delete(id)
}

function saveAndDeleteChunk(chunk) {
  // TODO save

  gl.deleteBuffer(chunk.faces.posBuffer)
  gl.deleteBuffer(chunk.faces.negBuffer)

  chunks.delete(chunk.key)
  loadedChunks.delete(chunk.key)
}

function chunkKey(x, z) {
  return `${x}:${z}`
}

function drawChunks() {
  let faceCount = 0

  let floatCamX = camera.x / CHUNK_SIZE, floatCamZ = camera.z / CHUNK_SIZE
  let [camX, camZ] = getChunkPos(camera.x, camera.z)

  let unloaded = chunks.size > maxChunksInMemory ? [] : null

  for (let [key, chunk] of chunks.entries()) {
    if (chunk.generating) continue

    if (!loadedChunks.has(key)) {
      if (unloaded) {
        let dist = Math.hypot(chunk.x - floatCamX, chunk.z - floatCamZ)
        if (dist >= renderDistance * 1.2) {
          unloaded.push({ chunk, dist })
        }
      }
      continue
    }

    let { lengths, posBuffer, negBuffer } = chunk.faces

    gl.uniform2i(programs.block.uniform.u_offset, chunk.x * CHUNK_SIZE, chunk.z * CHUNK_SIZE)

    let px = chunk.x <= camX, pz = chunk.z <= camZ
    let posStart = px ? 0 : lengths.pos.x
    let posCount = (px ? lengths.pos.x : 0) + lengths.pos.y + (pz ? lengths.pos.z : 0)
    if (posCount) {
      faceCount += posCount

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
      gl.vertexAttribIPointer(programs.block.attrib.a_data, 1, gl.INT, 0, posStart * 4)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, posCount)
    }

    let nx = chunk.x >= camX, nz = chunk.z >= camZ
    let negStart = nx ? 0 : lengths.neg.x
    let negCount = (nx ? lengths.neg.x : 0) + lengths.neg.y + (nz ? lengths.neg.z : 0)
    if (negCount) {
      faceCount += negCount

      gl.bindBuffer(gl.ARRAY_BUFFER, negBuffer)
      gl.vertexAttribIPointer(programs.block.attrib.a_data, 1, gl.INT, 0, negStart * 4)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, negCount)
    }
  }

  if (unloaded) {
    unloaded.sort((a, b) => b.dist - a.dist)
    let count = Math.min(unloaded.length, chunks.size - maxChunksInMemory)
    for (let i = 0; i < count; i++) {
      saveAndDeleteChunk(unloaded[i].chunk)
    }
  }

  return faceCount
}
