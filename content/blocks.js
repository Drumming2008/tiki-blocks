// this format sucks but it can stay for now
// they have like a string id and a numerical id i guess???? idk

const blocks = {
  AIR: {
    id: 0
  },
  STONE_BRICKS: {
    id: 1
  }
}

const blocksById = {}
for (let stringId in blocks) {
  let data = blocks[stringId]
  data.stringId = stringId
  blocksById[data.id] = data
}
