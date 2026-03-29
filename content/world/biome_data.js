const temperatureCutoffs = [-0.4, 0, 0.4]
const humidityCutoffs = [-0.4, 0, 0.4]

const biomeTable = [
  //   0   <----- humidity ----->   3       temp v
  ["cheese", "cheese", "cheese", "stone" ], // 0
  ["cheese", "stone",  "plains", "plains"],
  ["plains", "plains", "plains", "desert"],
  ["desert", "desert", "desert", "desert"]  // 3
]

function biomeTableLookup(temp, humidity) {
  let tempIndex = temperatureCutoffs.findLastIndex(min => min <= temp) + 1
  let humidityIndex = humidityCutoffs.findLastIndex(min => min <= humidity) + 1

  return biomes[biomeTable[tempIndex][humidityIndex]]
}

const biomes = {
  ocean: {
    surface: Block.GRASS, // surface block is only used above water level
    soil: Block.GRAVEL
  },
  beach: {
    surface: Block.SAND,
    soil: Block.SAND
  },
  plains: {
    surface: Block.GRASS,
    soil: Block.DIRT
  },
  desert: {
    surface: Block.SAND,
    soil: Block.SAND
  },
  stone: {
    surface: Block.STONE,
    soil: Block.STONE
  },
  cheese: {
    surface: Block.CHEESE,
    soil: Block.CHEESE_BRICKS
  }
}
