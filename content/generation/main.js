importScripts("../utils.js", "./chunk.js")

let blockTextureIndices

onmessage = ({ data: { id, type, data } }) => {
  if (type === "setup") {
    blockTextureIndices = data.blockTextureIndices
    postMessage(null)
  } else if (type == "seed") {
    noise = createNoise(data.seed)
    noise2 = createNoise(data.seed + 1)
    noise3 = createNoise(data.seed + 2)
    humidityNoise = createNoise(data.seed + 4)
    temperatureNoise = createNoise(data.seed + 3)
  } else if (type === "generate") {
    let chunk = generateChunk(data.x, data.z)
    chunk.faces = computeFaces(chunk)

    postMessage(
      { id, data: chunk },
      { transfer: [chunk.blocks.buffer, chunk.heightmap.buffer, chunk.faces.posData.buffer, chunk.faces.negData.buffer] }
    )
  } else {
    console.error(`Unknown message type sent to worker '${type}'`, data)
  }
}
