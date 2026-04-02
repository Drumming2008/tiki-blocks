const rawBlocks = {
  AIR: {
    id: 0,
    name: "Air",
    model: models.NONE
  },
  STONE_BRICKS: {
    id: 1,
    name: "Stone Bricks",
    model: {
      ...models.BLOCK,
      $tex: "stone_bricks/1"
    }
  },
  GRASS: {
    id: 2,
    name: "Grass",
    model: {
      ...models.THREE_TEX,
      $top: "grass_top",
      $side: "grass_side",
      $bottom: "dirt"
    }
  },
  DIRT: {
    id: 3,
    name: "Dirt",
    model: {
      ...models.BLOCK,
      $tex: "dirt"
    }
  },
  ROCKY_DIRT: {
    id: 4,
    name: "Rocky Dirt",
    model: {
      ...models.BLOCK,
      $tex: "rocky_dirt"
    }
  },
  BEDROCK: {
    id: 5,
    name: "Bedrock",
    model: {
      ...models.BLOCK,
      $tex: "bedrock"
    }
  },
  STONE: {
    id: 6,
    name: "Stone",
    model: {
      ...models.BLOCK,
      $tex: "stone"
    }
  },
  GRAVEL: {
    id: 7,
    name: "Gravel",
    model: {
      ...models.BLOCK,
      $tex: "gravel"
    }
  },
  MUD: {
    id: 8,
    name: "Mud",
    model: {
      ...models.BLOCK,
      $tex: "mud"
    }
  },
  SAND: {
    id: 9,
    name: "Sand",
    model: {
      ...models.BLOCK,
      $tex: "sand"
    }
  },
  SMALL_CHEESE: {
    id: 253,
    name: "Quesito",
    model: {
      parts: [
        { x: 4, y: 4, z: 4, dx: 8, dy: 8, dz: 8, tex: "cheese" }
      ]
    }
  },
  CHEESE_BRICKS: {
    id: 254,
    name: "Cheese Bricks",
    model: {
      ...models.BLOCK,
      $tex: "cheese_bricks"
    }
  },
  CHEESE: {
    id: 255,
    name: "Cheese",
    model: {
      ...models.BLOCK,
      $tex: "cheese"
    }
  }
}

const blocks = Object.values(rawBlocks)

const Block = {} // ex. AIR -> 0, for block ID literals in code
const blocksById = {} // ex. 0 -> { name: "Air", ... }

for (let key in rawBlocks) {
  let block = rawBlocks[key]

  Block[key] = block.id
  blocksById[block.id] = block
}
