const temperatureCutoffs = [-0.4, 0, 0.4]
const humidityCutoffs = [-0.4, 0, 0.4]

const biomeTable = [
  //   0   <----- humidity ----->   3       temp v
  ["cheese", "cheese", "stone",  "stone" ], // 0
  ["cheese", "stone",  "stone",  "plains"],
  ["plains", "plains", "plains", "desert"],
  ["desert", "desert", "desert", "desert"]  // 3
]

function biomeTableLookup(temp, humidity) {
  let tempIndex = temperatureCutoffs.findLastIndex(min => min <= temp) + 1
  let humidityIndex = humidityCutoffs.findLastIndex(min => min <= humidity) + 1

  return biomes[biomeTable[tempIndex][humidityIndex]]
}

const biomes = {
  // TODO need a better name than 'dirt'
  plains: {
    surface: Block.GRASS,
    dirt: Block.DIRT
  },
  desert: {
    surface: Block.SAND,
    dirt: Block.SAND
  },
  stone: {
    surface: Block.STONE,
    dirt: Block.STONE
  },
  cheese: {
    surface: Block.CHEESE,
    dirt: Block.CHEESE_BRICKS
  }
}
