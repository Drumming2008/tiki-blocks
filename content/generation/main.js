importScripts("../utils.js", "./chunk.js", "./noise.js")

let blockTextureIndices

onmessage = ({ data: { id, type, data } }) => {
  if (type === "setup") {
    blockTextureIndices = data.blockTextureIndices
    initNoise(data.seed)
    computeModels()
    postMessage(null)
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
