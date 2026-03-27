importScripts("../world/block_data.js", "../world/biome_data.js", "../generation/perlin.js")

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

      // begin cheese monolith shenanigans
      // let dist = Math.hypot(x - 16, z - 16)
      // if (chunkX % 10 === 2 && chunkZ % 10 === 2 && dist < 14) {
      //   let height = heightmap[layerIndex] = dist < 13 ? 250 : 255
      //   for (let y = 0; y < height; y++) {
      //     blocks[layerIndex + y * CHUNK_LAYER_LEN] = Block.CHEESE_BRICKS
      //   }
      //   if (x === 16 && z === 16) {
      //     heightmap[layerIndex] += 3
      //     blocks[layerIndex + 250 * CHUNK_LAYER_LEN] = Block.STONE_BRICKS
      //     blocks[layerIndex + 251 * CHUNK_LAYER_LEN] = Block.STONE_BRICKS
      //     blocks[layerIndex + 252 * CHUNK_LAYER_LEN] = Block.CHEESE
      //   }
      //   continue
      // }
      // end cheese monolith shenanigans

      let height = Math.max(0, Math.round(getHeight(worldX, worldZ)))
      heightmap[layerIndex] = height

      blocks[layerIndex] = Block.BEDROCK

      for (let y = 1; y <= height; y++) {
        let block = Block.DIRT
        if (y === height) {
        //   block = Block.MUD
        //   if (Math.round(getHeight(worldX, worldZ)) > 36) block = Block.DIRT
        //   if (Math.round(getHeight(worldX, worldZ) > 35 && Math.random() > 0.5)) block = Block.DIRT
        //   if (Math.round(getHeight(worldX, worldZ)) > 40) block = Block.GRASS
        //   if (Math.round(getHeight(worldX, worldZ) > 39 && Math.random() > 0.5)) block = Block.GRASS

          // let temp = temperatureNoise.perlin2(worldX / temperatureScale, worldZ / temperatureScale)
          // let blockList = ["BEDROCK", "MUD", "DIRT", "STONE_BRICKS", "STONE", "GRAVEL", "GRASS", "CHEESE_BRICKS", "SAND"]
          // block = Block[blockList[Math.round((temp + 1) / 2 * blockList.length)]]

          // let humidity = humidityNoise.perlin2(worldX / humidityScale, worldZ / humidityScale)
          // let blockList = ["BEDROCK", "MUD", "DIRT", "STONE_BRICKS", "STONE", "GRAVEL", "GRASS", "CHEESE_BRICKS", "SAND"]
          // block = Block[blockList[Math.round((humidity + 1) / 2 * blockList.length)]]
          let closestTemp = findClosest(biomeCategories, (temperatureNoise.perlin2(worldX / temperatureScale, worldZ / temperatureScale) + temperatureNoise2.perlin2(worldX / temperatureScale, worldZ / temperatureScale)) / 2)
          let closestHumidity = findClosest(biomeCategories, humidityNoise.perlin2(worldX / humidityScale, worldZ / humidityScale))
          let biome = [biomeCategories.indexOf(closestTemp), biomeCategories.indexOf(closestHumidity)]
          // block = Block[biomeBlocks[biomeScale.indexOf()]]
          if (biome_index[biome[0] + "" + biome[1]]) {
            block = Block[biome_data[biome_index[biome[0] + "" + biome[1]]].surface]
          }
        }
        blocks[layerIndex + y * CHUNK_LAYER_LEN] = block
      }
    }
  }

  return { blocks, heightmap }
}

//                 0   1      2       3       4     5     6
let biomeCategories = [-1, -0.78, -0.375, -0.2225, 0.05, 0.45, 0.55, 1]

function findClosest(list, goal) {
  return list.reduce((prev, curr) => {
    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
  })
}

// put noises here, but initialize them in ./generation/main.js
let noise, noise2, noise3, temperatureNoise, temperatureNoise2, humidityNoise

let verticalScale = 50, horizontalScale = 50, temperatureScale = 1000, humidityScale = 1000

function getNoise(noise, x, z) {
  let val = 0
  let i
  for (i = 0; i < noise.length; i++) {
    val += noise[i].perlin2((x / horizontalScale) / (i + 1), (z / horizontalScale) / (i + 1))
  }
  return ((val * (verticalScale)) / i) + (verticalScale)
  
}

function getHeight(x, z) {
  return getNoise([noise, noise2, noise3], x, z)
}

function isTransparent(id) {
  return blocksById[id].transparent
}
