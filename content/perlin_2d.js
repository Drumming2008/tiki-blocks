class Perlin2D {
  constructor(seed) {
    this.seed = seed
  }

  randCache = new Map()

  rand(x, y) {
    let key = `${x}:${y}`

    if (this.randCache.has(key)) {
      return this.randCache.get(key)
    }

    let random = seededRandom(hashString(key) ^ this.seed)
    void random(), random(), random(), random()

    let vec = this.normalize(random() * 2 - 1, random() * 2 - 1)
    this.randCache.set(key, vec)
    return vec
  }

  normalize(x, y) {
    let dist = Math.hypot(x, y)
    return [x / dist, y / dist]
  }

  dot(g, x, y) {
    return g[0] * x + g[1] * y
  }

  mix(a, b, t) {
    return a + (b - a) * t
  }

  fade(t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
  }

  sample(x, y) {
    // find unit grid cell containing point
    let X = Math.floor(x),
        Y = Math.floor(y)

    // get relative xy coordinates of point within that cell
    x -= X
    y -= Y

    // calculate noise contributions from each of the four corners
    let n00 = this.dot(this.rand(X, Y), -x, -y),
        n10 = this.dot(this.rand(X + 1, Y), 1 - x, -y),
        n01 = this.dot(this.rand(X, Y + 1), -x, 1 - y),
        n11 = this.dot(this.rand(X + 1, Y + 1), 1 - x, 1 - y)

    // compute the fade curve value for x and y
    let u = this.fade(x),
        v = this.fade(y)

    // interpolate along x the contributions from each of the corners
    let nx0 = this.mix(n00, n10, u),
        nx1 = this.mix(n01, n11, u)

    // interpolate the two results along y
    return this.mix(nx0, nx1, v)
  }
}

class OctavePerlin2D {
  constructor(seed, octaves) {
    this.octaves = octaves.map(octave => {
      let perlin = new Perlin2D(seed)
      return {
        perlin,
        ...octave,
        offset: [perlin.sample(0.5, 0.5), perlin.sample(1.5, 1.5)],
      }
    })
  }

  sample(x, y) {
    let noise = this.octaves.reduce((sum, { scale, magnitude, offset, perlin }) => {
      return sum + perlin.sample((x + offset[0]) / scale, (y + offset[1]) / scale) * magnitude
    }, 0)
    if (isNaN(noise)) debugger
    return noise
  }
}
