importScripts("../world/block_data.js", "../world/biome_data.js")

const paddingArray = Array(FACE_BUFFER_PADDING).fill(0)

function computeFaces({ blocks, heightmap }) {
  let py = [], ny = [], px = [], nx = [], pz = [], nz = []

  // tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let blockDataX = x << 8

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let blockDataXZ = blockDataX | z << 13

      let layerIndex = x + z * CHUNK_SIZE
      let height = heightmap[layerIndex]

      for (let y = 0; y <= height; y++) {
        let i = layerIndex + y * CHUNK_LAYER_LEN
        let data = blocksById[blocks[i]]
        if (data.invisible) continue

        let texSide = blockTextureIndices[data.texture]
        let blockData = blockDataXZ | y
        let blockDataSide = blockData | texSide << 24

        if (y === height || isTransparent(blocks[i + CHUNK_LAYER_LEN])) {
          let texTop = blockTextureIndices[data.textureTop] ?? texSide
          py.push(blockData | texTop << 24)
        }
        if (y > 0 && isTransparent(blocks[i - CHUNK_LAYER_LEN])) {
          let texBottom = blockTextureIndices[data.textureBottom] ?? texSide
          ny.push(blockData | texBottom << 24 | 1 << 18)
        }
        if (x < CHUNK_SIZE - 1 && isTransparent(blocks[i + 1])) {
          px.push(blockDataSide | 2 << 18)
        }
        if (x > 0 && isTransparent(blocks[i - 1])) {
          nx.push(blockDataSide | 3 << 18)
        }
        if (z < CHUNK_SIZE - 1 && isTransparent(blocks[i + CHUNK_SIZE])) {
          pz.push(blockDataSide | 4 << 18)
        }
        if (z > 0 && isTransparent(blocks[i - CHUNK_SIZE])) {
          nz.push(blockDataSide | 5 << 18)
        }
      }
    }
  }

  return {
    posData: new Int32Array(px.concat(py, pz, paddingArray)),
    negData: new Int32Array(nx.concat(ny, nz, paddingArray)),
    lengths: {
      pos: { x: px.length, y: py.length, z: pz.length, padding: FACE_BUFFER_PADDING },
      neg: { x: nx.length, y: ny.length, z: nz.length, padding: FACE_BUFFER_PADDING }
    }
  }
}

function generateChunk(chunkX, chunkZ) {
  let blocks = new Uint8Array(CHUNK_LEN), heightmap = new Uint8Array(CHUNK_LAYER_LEN)

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let worldX = x + chunkX * CHUNK_SIZE

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let worldZ = z + chunkZ * CHUNK_SIZE
      let layerIndex = x + z * CHUNK_SIZE

      let biome = sampleBiome(worldX, worldZ)
      let approxHeight = sampleApproxTerrainHeight(worldX, worldZ)
      let maxY = 1, wasSolid = true
      blocks[layerIndex] = Block.BEDROCK

      for (let y = 1; y <= CHUNK_HEIGHT; y++) {
        let density = (approxHeight - y) / land3DAmount

        if (density > -1 && (density >= 1 || sampleRawTerrainDensity(worldX, y, worldZ) < density)) {
          blocks[layerIndex + y * CHUNK_LAYER_LEN] = Block.STONE
          maxY = y
        } else {
          let lastY = y - 1
          if (maxY === lastY) {
            blocks[layerIndex + lastY * CHUNK_LAYER_LEN] = biome.surface
            for (let dy = 1; dy <= dirtLayerThickness; dy++) {
              let i = layerIndex + (lastY - dy) * CHUNK_LAYER_LEN
              if (!blocks[i]) break
              blocks[i] = biome.dirt
            }
          }

          if (density <= -1) break
        }
      }

      heightmap[layerIndex] = maxY
    }
  }

  return { blocks, heightmap }
}

function isTransparent(id) {
  return blocksById[id].transparent
}
