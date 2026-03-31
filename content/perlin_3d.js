class Perlin3D {
  constructor(seed, flattening = 1) {
    this.seed = seed
    this.flattening = flattening
  }

  randCache = new Map()

  rand(x, y, z) {
    let key = `${x}:${y}:${z}`

    if (this.randCache.has(key)) {
      return this.randCache.get(key)
    }

    let random = seededRandom(hashString(key) ^ this.seed)
    void random(), random(), random(), random()

    let vec = this.normalize(random() * 2 - 1, (random() - 0.5) * 2 * this.flattening, random() * 2 - 1)
    this.randCache.set(key, vec)
    return vec
  }

  normalize(x, y, z) {
    let dist = Math.hypot(x, y, z)
    return [x / dist, y / dist, z / dist]
  }

  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z
  }

  mix(a, b, t) {
    return a + (b - a) * t
  }

  fade(t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
  }

  sample(x, y, z) {
    // find unit grid cell containing point
    let X = Math.floor(x),
        Y = Math.floor(y),
        Z = Math.floor(z)

    // get relative xyz coordinates of point within that cell
    x -= X
    y -= Y
    z -= Z

    // calculate noise contributions from each of the eight corners
    let n000 = this.dot(this.rand(X,     Y,     Z    ),    -x,    -y,    -z),
        n100 = this.dot(this.rand(X + 1, Y,     Z    ), 1 - x,    -y,    -z),
        n010 = this.dot(this.rand(X,     Y + 1, Z    ),    -x, 1 - y,    -z),
        n110 = this.dot(this.rand(X + 1, Y + 1, Z    ), 1 - x, 1 - y,    -z),
        n001 = this.dot(this.rand(X,     Y,     Z + 1),    -x,    -y, 1 - z),
        n101 = this.dot(this.rand(X + 1, Y,     Z + 1), 1 - x,    -y, 1 - z),
        n011 = this.dot(this.rand(X,     Y + 1, Z + 1),    -x, 1 - y, 1 - z),
        n111 = this.dot(this.rand(X + 1, Y + 1, Z + 1), 1 - x, 1 - y, 1 - z)

    // compute the fade curve value for each of x, y, z
    let u = this.fade(x),
        v = this.fade(y),
        w = this.fade(z)

    // interpolate along x the contributions from each of the corners
    let nx00 = this.mix(n000, n100, u),
        nx01 = this.mix(n001, n101, u),
        nx10 = this.mix(n010, n110, u),
        nx11 = this.mix(n011, n111, u)

    // interpolate the four results along y
    let nxy0 = this.mix(nx00, nx10, v),
        nxy1 = this.mix(nx01, nx11, v)

    // interpolate the two last results along z
    return this.mix(nxy0, nxy1, w)
  }
}

class OctavePerlin3D {
  constructor(seed, octaves, flattening = 1) {
    this.octaves = octaves.map(octave => {
      let perlin = new Perlin3D(seed, flattening)
      return {
        perlin,
        ...octave,
        offset: [perlin.sample(0.5, 0.5, 0.5), perlin.sample(1.5, 1.5, 1.5), perlin.sample(2.5, 2.5, 2.5)]
      }
    })
  }

  sample(x, y, z) {
    return this.octaves.reduce((sum, { scale, yScale = 1, magnitude, offset, perlin }) => {
      return sum + perlin.sample((x + offset[0]) / scale, (y + offset[1]) / (scale * yScale), (z + offset[2]) / scale) * magnitude
    }, 0)
  }
}
