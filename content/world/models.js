function computeModels() {
  for (let { model } of blocks) {
    computeModel(model)
  }
}

function computeModel(model) {
  if (model.computed) return
  model.computed = true

  let mesh = []
  let faces = {}

  for (let part of model.parts) {
    // TODO singular face part that is not a cube?

    let { x, y, z, dx, dy, dz } = part

    let tex       = part.tex      && blockTextureIndices[resolveModelTex(model, part.tex      )]
    let texTop    = part.texTop    ? blockTextureIndices[resolveModelTex(model, part.texTop   )] : tex
    let texSide   = part.texSide   ? blockTextureIndices[resolveModelTex(model, part.texSide  )] : tex
    let texBottom = part.texBottom ? blockTextureIndices[resolveModelTex(model, part.texBottom)] : tex

    let fullSizeY = !x && !z && dx === 16 && dz === 16

    // tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

    if (texTop) {
      if (fullSizeY && y + dy === 16) {
        faces.py = texTop << 24
      } else if (dx && dz) {
        mesh.push(x, y, z, x + dx, y, z, x + dx, y, z + dz, x + dx, y, z, x + dx, y, z + dz, x, y, z + dz)
      }
    }
    if (texBottom) {
      if (fullSizeY && !y) {
        faces.ny = texBottom << 24 | 1 << 18
      }
    }
    if (texSide) {
      let texData = texSide << 24

      if (!y && !z && dy === 16 && dz === 16) {
        if (x + dx === 16) faces.px = texData | 2 << 18
        if (!x) faces.nx = texData | 3 << 18
      }
      if (!x && !y && dx === 16 && dy === 16) {
        if (z + dz === 16) faces.pz = texData | 4 << 18
        if (!z) faces.nz = texData | 5 << 18
      }
    }
  }

  if (mesh.length) {
    model.mesh = new Float32Array(mesh)
  }
  if (Object.keys(faces).length) {
    model.faces = faces
  }
}

function resolveModelTex(model, tex) {
  while (tex?.startsWith("$")) tex = model[tex]
  return tex || null
}
