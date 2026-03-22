const blocks = [
  {
    id: 0,
    name: "Air",
    transparent: true,
    invisible: true
  },
  {
    id: 1,
    name: "Stone Bricks",
    texture: "stone_bricks"
  },
  {
    id: 2,
    name: "Grass",
    texture: "grass_side",
    textureTop: "grass_top",
    textureBottom: "dirt"
  },
  {
    id: 3,
    name: "Dirt",
    texture: "dirt"
  },
  {
    id: 4,
    name: "Rocky Dirt",
    texture: "rocky_dirt"
  },
  {
    id: 5,
    name: "Stone",
    texture: "stone"
  },
  {
    id: 254,
    name: "Cheese Bricks",
    texture: "cheese_bricks"
  },
  {
    id: 255,
    name: "Cheese",
    texture: "cheese"
  }
]

const blocksById = {}
for (let block of blocks) {
  blocksById[block.id] = block
}
