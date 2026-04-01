const models = {
  NONE: {
    parts: []
  },
  BLOCK: {
    parts: [
      {
        x: 0, y: 0, z: 0,
        dx: 16, dy: 16, dz: 16,
        texTop: "$tex", texSide: "$tex", texBottom: "$tex"
      }
    ]
  },
  PILLAR: {
    parts: [
      {
        x: 0, y: 0, z: 0,
        dx: 16, dy: 16, dz: 16,
        texTop: "$end", texSide: "$side", texBottom: "$end"
      }
    ]
  },
  THREE_TEX: {
    parts: [
      {
        x: 0, y: 0, z: 0,
        dx: 16, dy: 16, dz: 16,
        texTop: "$top", texSide: "$side", texBottom: "$bottom"
      }
    ]
  }
}
