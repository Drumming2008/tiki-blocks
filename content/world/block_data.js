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
    texture: "stone_bricks/1"
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
    id: 6,
    name: "Stone",
    texture: "stone"
  },
  GRAVEL: {
    id: 7,
    name: "Gravel",
    texture: "gravel"
  },
  MUD: {
    id: 8,
    name: "Mud",
    texture: "mud"
  },
  SAND: {
    id: 9,
    name: "Sand",
    texture: "sand"
  },
  CHEESE_BRICKS: {
    id: 254,
    name: "Cheese Bricks",
    texture: "cheese_bricks"
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
