importScripts("../utils.js", "./chunk.js")

onmessage = ({ data: { id, data } }) => {
  let chunk = generateChunk(data.x, data.z)
  chunk.faces = computeFaces(chunk)

  postMessage(
    { id, data: chunk },
    { transfer: [chunk.faces.data.buffer] }
  )
}
