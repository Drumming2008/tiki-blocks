const BLOCK_TEXTURE_SIZE = 16

let blockTextureIndices = {} // texture name -> index

let blockTextures = new Set()
for (let { model } of blocks) {
  for (let { tex, texTop, texSide, texBottom } of model.parts) {
    if (tex)       blockTextures.add(resolveModelTex(model, tex))
    if (texTop)    blockTextures.add(resolveModelTex(model, texTop))
    if (texSide)   blockTextures.add(resolveModelTex(model, texSide))
    if (texBottom) blockTextures.add(resolveModelTex(model, texBottom))
  }
}
blockTextures.delete(null)
blockTextures = [...blockTextures]

for (let i = 0; i < blockTextures.length; i++) {
  let texture = blockTextures[i]
  blockTextureIndices[texture] = i

  waitForLoad(loadImage(`blocks/${texture}`).then(img => {
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, BLOCK_TEXTURE_SIZE, BLOCK_TEXTURE_SIZE, 1, gl.RGBA, gl.UNSIGNED_BYTE, img)
  }))
}

computeModels()

let blockTexture = createTexture(BLOCK_TEXTURE_SIZE, BLOCK_TEXTURE_SIZE, blockTextures.length, null, true)

function getBlock(x, y, z) {
  if (y < 0 || y >= CHUNK_HEIGHT) return null

  let chunk = getChunk(...getChunkPos(x, z))
  return chunk?.getBlockWorld(x, y, z) || null
}
