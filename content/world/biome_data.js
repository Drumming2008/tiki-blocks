const temperatureRanges = [-1, -0.5, 0, 0.5]
const humidityRanges = [-1, -0.5, 0, 0.5]

const biomeTable = [
  //   0   <----- humidity ----->   3       temp v
  ["cheese", "cheese", "stone",  "stone" ], // 0
  ["cheese", "stone",  "stone",  "plains"],
  ["plains", "plains", "plains", "desert"],
  ["desert", "desert", "desert", "desert"]  // 3
]

function biomeTableLookup(temp, humidity) {
  temp = clamp(temp, -1, 1)
  humidity = clamp(humidity, -1, 1)

  let tempIndex = temperatureRanges.findLastIndex(min => min <= temp)
  let humidityIndex = humidityRanges.findLastIndex(min => min <= humidity)

  return biomes[biomeTable[tempIndex][humidityIndex]]
}

const biomes = {
  plains: {
    surface: Block.GRASS
  },
  desert: {
    surface: Block.SAND
  },
  stone: {
    surface: Block.STONE
  },
  cheese: {
    surface: Block.CHEESE
  }
}
