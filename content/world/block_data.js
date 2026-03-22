const rawBlocks = {
  AIR: {
    id: 0,
    name: "Air",
    transparent: true,
    invisible: true
  },
  STONE_BRICKS: {
    id: 1,
    name: "Stone Bricks",
    texture: "stone_bricks"
  },
  GRASS: {
    id: 2,
    name: "Grass",
    texture: "grass_side",
    textureTop: "grass_top",
    textureBottom: "dirt"
  },
  DIRT: {
    id: 3,
    name: "Dirt",
    texture: "dirt"
  },
  ROCKY_DIRT: {
    id: 4,
    name: "Rocky Dirt",
    texture: "rocky_dirt"
  },
  BEDROCK: {
    id: 5,
    name: "Bedrock (cheeserock)",
    texture: "bedrock"
  },
  STONE: {
    id: 5,
    name: "Stone",
    texture: "stone"
  },
  CHEESE: {
    id: 255,
    name: "Cheese",
    texture: "cheese"
  }
}

const blocks = Object.values(rawBlocks)

// ex. AIR -> 0, for block ID literals in code
const Block = {}
for (let key in rawBlocks) {
  Block[key] = rawBlocks[key].id
}

// ex. 0 -> { name: "Air", ... }
const blocksById = {}
for (let block of blocks) {
  blocksById[block.id] = block
}
