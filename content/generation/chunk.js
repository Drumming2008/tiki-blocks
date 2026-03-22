importScripts("../world/block_data.js")

function computeFaces({ blocks, heightmap }) {
  let py = [], ny = [], px = [], nx = [], pz = [], nz = []

  // see shaders/block.vsh
  // tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let blockDataX = x << 8

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let blockDataXZ = blockDataX | z << 13

      let layerIndex = x + z * CHUNK_SIZE
      let height = heightmap[layerIndex]

      for (let y = 0; y <= height; y++) {
        let i = layerIndex + y * CHUNK_LAYER_LEN
        let block = blocks[i], data = blocksById[block]

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
    data: new Int32Array(px.concat(py, pz, nx, ny, nz)),
    lengths: [px.length, py.length, pz.length, nx.length, ny.length, nz.length]
  }
}

function generateChunk(chunkX, chunkZ) {
  let blocks = new Uint8Array(CHUNK_LEN), heightmap = new Uint8Array(CHUNK_LAYER_LEN)

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let worldX = x + chunkX * CHUNK_SIZE

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let worldZ = z + chunkZ * CHUNK_SIZE
      let layerIndex = x + z * CHUNK_SIZE

      // begin cheese monolith shenanigans
      let dist = Math.hypot(x - 16, z - 16)
      if (chunkX % 10 === 2 && chunkZ % 10 === 2 && dist < 14) {
        let height = heightmap[layerIndex] = dist < 13 ? 250 : 255
        for (let y = 0; y < height; y++) {
          blocks[layerIndex + y * CHUNK_LAYER_LEN] = Block.CHEESE_BRICKS
        }
        if (x === 16 && z === 16) {
          heightmap[layerIndex] += 3
          blocks[layerIndex + 250 * CHUNK_LAYER_LEN] = Block.STONE_BRICKS
          blocks[layerIndex + 251 * CHUNK_LAYER_LEN] = Block.STONE_BRICKS
          blocks[layerIndex + 252 * CHUNK_LAYER_LEN] = Block.CHEESE
        }
        continue
      }
      // end cheese monolith shenanigans

      let height = Math.max(0, Math.round(getHeight(worldX, worldZ)))
      heightmap[layerIndex] = height

      blocks[layerIndex] = Block.BEDROCK

      for (let y = 1; y <= height; y++) {
        let block = Block.STONE_BRICKS
        if (y === height) {
          let noise = Math.sin(worldX / 13) + Math.sin(worldZ / 13)
          let slope = getSlope(worldX, worldZ) + noise / 4
          if (slope < 0.3) block = Block.GRASS
          else if (slope < 0.5) block = noise > 0.5 ? Block.ROCKY_DIRT : Block.DIRT
          else if (slope < 0.6) block = Block.ROCKY_DIRT
        }
        blocks[layerIndex + y * CHUNK_LAYER_LEN] = block
      }
    }
  }

  return { blocks, heightmap }
}

function getHeight(x, z) {
  // temporary
  return (Math.sin(x / 50) + Math.sin(z / 50)) * 15 + (Math.sin(x / 10) + Math.sin(z / 10)) * 4 + 20
}
// temporary
function getSlope(x, z) {
  return Math.hypot(0.3 * Math.cos(x / 50) + 0.4 * Math.cos(x / 10), 0.3 * Math.cos(z / 50) + 0.4 * Math.cos(z / 10))
}

function isTransparent(id) {
  return blocksById[id].transparent
}
