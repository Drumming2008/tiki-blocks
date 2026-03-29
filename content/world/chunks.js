let chunks = new Map(), loadedChunks = new Set()

const seed = (Math.random() * 0x100000000) ^ Date.now()
console.log("SEED:", seed)

function getBlockIdAt(x, y, z) {
  if (y < 0 || y >= CHUNK_HEIGHT) return null

  let chunk = getChunk(...getChunkPos(x, z))
  if (!chunk) return null

  return chunk.blocks[chunkBlockIndex(...wrapPosToChunkSize(x, y, z))]
}

function wrapPosToChunkSize(x, y, z) {
  let [chunkX, chunkZ] = getChunkPos(x, z)
  return [x - chunkX * CHUNK_SIZE, y, z - chunkZ * CHUNK_SIZE]
}

function chunkBlockIndex(x, y, z) {
  return x + z * CHUNK_SIZE + y * CHUNK_LAYER_LEN
}

function getChunk(x, z, includeLoading = false) {
  let chunk = chunks.get(chunkKey(x, z))
  if (chunk?.loading && !includeLoading) return null
  return chunk || null
}

function getChunkPos(x, z) {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)]
}

function sampleHeightmap(chunk, x, z) {
  return chunk.heightmap[x + z * CHUNK_SIZE]
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

  chunks.set(key, { loading: true })

  let chunk = await queueGenerateTask(x, z)
  chunk.key = key
  chunks.set(key, chunk)

  chunk.x = x
  chunk.z = z

  chunk.faces.posBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, chunk.faces.posBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, chunk.faces.posData, gl.STATIC_DRAW)

  chunk.faces.negBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, chunk.faces.negBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, chunk.faces.negData, gl.STATIC_DRAW)

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

      let ownH = sampleHeightmap(chunk, CHUNK_SIZE - 1, z)
      let otherH = sampleHeightmap(px, 0, z)

      for (let y = 0; y <= ownH; y++) {
        let data = blocksById[chunk.blocks[chunkBlockIndex(CHUNK_SIZE - 1, y, z)]]
        if (data.invisible) continue
        if (y <= otherH && !blocksById[px.blocks[chunkBlockIndex(0, y, z)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        pxFaces.push(blockDataXZ | y | tex << 24 | 2 << 18)
      }

      for (let y = 0; y <= otherH; y++) {
        let data = blocksById[px.blocks[chunkBlockIndex(0, y, z)]]
        if (data.invisible) continue
        if (y <= ownH && !blocksById[chunk.blocks[chunkBlockIndex(CHUNK_SIZE - 1, y, z)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        otherFaces.push(otherBlockDataXZ | y | tex << 24 | 3 << 18)
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

      let ownH = sampleHeightmap(chunk, 0, z)
      let otherH = sampleHeightmap(nx, CHUNK_SIZE - 1, z)

      for (let y = 0; y <= ownH; y++) {
        let data = blocksById[chunk.blocks[chunkBlockIndex(0, y, z)]]
        if (data.invisible) continue
        if (y <= otherH && !blocksById[nx.blocks[chunkBlockIndex(CHUNK_SIZE - 1, y, z)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        nxFaces.push(blockDataXZ | y | tex << 24 | 3 << 18)
      }

      for (let y = 0; y <= otherH; y++) {
        let data = blocksById[nx.blocks[chunkBlockIndex(CHUNK_SIZE - 1, y, z)]]
        if (data.invisible) continue
        if (y <= ownH && !blocksById[chunk.blocks[chunkBlockIndex(0, y, z)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        otherFaces.push(otherBlockDataXZ | y | tex << 24 | 2 << 18)
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

      let ownH = sampleHeightmap(chunk, x, CHUNK_SIZE - 1)
      let otherH = sampleHeightmap(pz, x, 0)

      for (let y = 0; y <= ownH; y++) {
        let data = blocksById[chunk.blocks[chunkBlockIndex(x, y, CHUNK_SIZE - 1)]]
        if (data.invisible) continue
        if (y <= otherH && !blocksById[pz.blocks[chunkBlockIndex(x, y, 0)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        pzFaces.push(blockDataXZ | y | tex << 24 | 4 << 18)
      }

      for (let y = 0; y <= otherH; y++) {
        let data = blocksById[pz.blocks[chunkBlockIndex(x, y, 0)]]
        if (data.invisible) continue
        if (y <= ownH && !blocksById[chunk.blocks[chunkBlockIndex(x, y, CHUNK_SIZE - 1)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        otherFaces.push(otherBlockDataXZ | y | tex << 24 | 5 << 18)
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

      let ownH = sampleHeightmap(chunk, x, 0)
      let otherH = sampleHeightmap(nz, x, CHUNK_SIZE - 1)

      for (let y = 0; y <= ownH; y++) {
        let data = blocksById[chunk.blocks[chunkBlockIndex(x, y, 0)]]
        if (data.invisible) continue
        if (y <= otherH && !blocksById[nz.blocks[chunkBlockIndex(x, y, CHUNK_SIZE - 1)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        nzFaces.push(blockDataXZ | y | tex << 24 | 5 << 18)
      }

      for (let y = 0; y <= otherH; y++) {
        let data = blocksById[nz.blocks[chunkBlockIndex(x, y, CHUNK_SIZE - 1)]]
        if (data.invisible) continue
        if (y <= ownH && !blocksById[chunk.blocks[chunkBlockIndex(x, y, 0)]].transparent) continue

        let tex = blockTextureIndices[data.texture]
        otherFaces.push(otherBlockDataXZ | y | tex << 24 | 4 << 18)
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
    if (chunk.loading) continue

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
