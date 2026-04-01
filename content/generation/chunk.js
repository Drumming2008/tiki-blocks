importScripts("../world/model_data.js", "../world/models.js", "../world/block_data.js", "../world/biome_data.js")

const DO_NOODLE_CAVES = false, DO_CHEESE_CAVES = false

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
        let { faces } = blocksById[blocks[i]].model
        if (!faces) continue

        let blockData = blockDataXZ | y

        if (y === height || isTransparent(blocks[i + CHUNK_LAYER_LEN])) {
          py.push(blockData | faces.py)
        }
        if (y > 0 && isTransparent(blocks[i - CHUNK_LAYER_LEN])) {
          ny.push(blockData | faces.ny)
        }
        if (x < CHUNK_SIZE - 1 && isTransparent(blocks[i + 1])) {
          px.push(blockData | faces.px)
        }
        if (x > 0 && isTransparent(blocks[i - 1])) {
          nx.push(blockData | faces.nx)
        }
        if (z < CHUNK_SIZE - 1 && isTransparent(blocks[i + CHUNK_SIZE])) {
          pz.push(blockData | faces.pz)
        }
        if (z > 0 && isTransparent(blocks[i - CHUNK_SIZE])) {
          nz.push(blockData | faces.nz)
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
  let blockBuffer = new ArrayBuffer(CHUNK_LEN, { maxByteLength: CHUNK_LEN })
  let blocks = new Uint8Array(blockBuffer), heightmap = new Uint8Array(CHUNK_LAYER_LEN)
  let maxH = 0

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let worldX = x + chunkX * CHUNK_SIZE

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let worldZ = z + chunkZ * CHUNK_SIZE
      let layerIndex = x + z * CHUNK_SIZE

      let [approxHeight, hillDampening] = sampleLandHeight(worldX, worldZ)
      let seaLevelDist = approxHeight - seaLevel, biome
      if (seaLevelDist < -4) {
        biome = biomes.ocean
      } else if (seaLevelDist < 2 && seaLevelDist < sampleBeachiness(worldX, worldZ)) {
        biome = biomes.beach
      } else {
        biome = sampleBiome(worldX, worldZ)
      }

      let hilliness = sampleHilliness(worldX, worldZ) * hillDampening
      approxHeight += sampleHillHeight(worldX, worldZ) * hilliness

      let land3DAmount = sampleLand3DAmount(worldX, worldZ) * hillDampening

      let maxY = 1
      blocks[layerIndex] = Block.BEDROCK

      for (let y = 1; y <= CHUNK_HEIGHT; y++) {
        if (DO_NOODLE_CAVES && isNoodleCave(0.04, worldX, y, worldZ)) continue
        if (DO_CHEESE_CAVES && isCheeseCave(-0.3, worldX, y, worldZ)) continue

        let density = (approxHeight - y) / land3DAmount

        if (density > -1 && (density >= 1 || sampleRawTerrainDensity(worldX, y, worldZ) < density)) {
          blocks[layerIndex + y * CHUNK_LAYER_LEN] = Block.STONE
          maxY = y
        } else {
          let lastY = y - 1
          if (maxY === lastY) {
            blocks[layerIndex + lastY * CHUNK_LAYER_LEN] = lastY >= seaLevel ? biome.surface : biome.soil
            for (let dy = 1; dy <= dirtLayerThickness; dy++) {
              let i = layerIndex + (lastY - dy) * CHUNK_LAYER_LEN
              if (!blocks[i]) break
              blocks[i] = biome.soil
            }
          }

          if (density <= -1) break
        }
      }

      heightmap[layerIndex] = maxY
      if (maxY > maxH) maxH = maxY
    }
  }

  blockBuffer.resize((maxH + 1) * CHUNK_LAYER_LEN)

  for (let name in noise) {
    noise[name].clearCache()
  }

  return { blocks, heightmap }
}

function isTransparent(id) {
  return !id // TODO
}
