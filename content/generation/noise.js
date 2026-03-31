importScripts("../perlin_2d.js", "../perlin_3d.js")

const dirtLayerThickness = 3
const seaLevel = 64

let noise

function initNoise(seed) {
  let s = 1 // temporary noise scale

  let random = seededRandom(seed, true)

  noise = {
    land: new OctavePerlin2D(random(), [
      { scale: s * 1000, magnitude: 1 },
      { scale: s * 400, magnitude: 0.4 },
      { scale: s * 100, magnitude: 0.1 },
      { scale: s * 30, magnitude: 0.03 }
    ]),
    land3D: new OctavePerlin3D(random(), [
      { scale: 20, magnitude: 1 }
      // { scale: 10, magnitude: 0.2 }
    ]),
    beachiness: new OctavePerlin2D(random(), [
      { scale: 400, magnitude: 1 },
      { scale: 80, magnitude: 0.2 },
      { scale: 10, magnitude: 0.03 }
    ]),
    hills: new OctavePerlin2D(random(), [
      { scale: 120, magnitude: 1 },
      { scale: 50, magnitude: 0.3 }
    ]),
    hilliness: new OctavePerlin2D(random(), [
      { scale: 800, magnitude: 1 },
      { scale: 200, magnitude: 1 },
    ]),
    land3DAmount: new OctavePerlin2D(random(), [
      { scale: 200, magnitude: 1 }
    ]),
    humidity: new OctavePerlin2D(random(), [
      { scale: s * 1500, magnitude: 1 },
      { scale: s * 700, magnitude: 0.5 },
      { scale: s * 200, magnitude: 0.2 }
    ]),
    temperature: new OctavePerlin2D(random(), [
      { scale: s * 1500, magnitude: 1 },
      { scale: s * 700, magnitude: 0.5 },
      { scale: s * 200, magnitude: 0.2 }
    ]),
    biomeOffsetX: new OctavePerlin2D(random(), [
      { scale: 32, magnitude: 1 },
      { scale: 6, magnitude: 0.3 }
    ]),
    biomeOffsetZ: new OctavePerlin2D(random(), [
      { scale: 32, magnitude: 1 },
      { scale: 6, magnitude: 0.3 }
    ]),
    noodleCaveA: new OctavePerlin3D(random(), [
      { scale: 80, yScale: 0.6, magnitude: 1 },
      { scale: 30, yScale: 0.6, magnitude: 0.3 }
    ], 0.5),
    noodleCaveB: new OctavePerlin3D(random(), [
      { scale: 110, yScale: 0.6, magnitude: 1 },
      { scale: 40, yScale: 0.6, magnitude: 0.3 }
    ], 0.5),
    cheeseCave: new OctavePerlin3D(random(), [
      { scale: 40, yScale: 0.7, magnitude: 1 },
      { scale: 15, yScale: 0.7, magnitude: 0.3 }
    ], 2.5)
  }
}

class Spline {
  constructor(points) {
    this.points = points
  }

  smoothMix(a, b, t) {
    return a + (b - a) * smoothstep(t)
  }

  transform(x) {
    x = clamp(x, -1, 1)
    let i = this.points.findLastIndex(p => p.x <= x), left = this.points[i]
    if (left.x === x) return left.y

    let right = this.points[i + 1]
    return this.smoothMix(left.y, right.y, (x - left.x) / (right.x - left.x))
  }
}

const splines = {
  land: new Spline([
    { x: -1, y: 10 },
    { x: -0.42, y: 12 },
    { x: -0.38, y: 30 },
    { x: -0.1, y: 33 },
    { x: -0.03, y: 40 },
    { x: 0, y: seaLevel + 1 },
    { x: 0.15, y: 72 },
    { x: 0.3, y: 68, },
    { x: 0.5, y: 84 },
    { x: 0.8, y: 120 },
    { x: 1, y: 70 }
  ])
}

function sampleLandHeight(x, z) {
  let raw = noise.land.sample(x, z)
  let hillDampening = Math.abs(raw) / (raw < 0 ? 0.03 : 0.1)

  return [
    splines.land.transform(raw),
    smoothstep(Math.min(1, hillDampening))
  ]
}

function sampleBeachiness(x, z) {
  let raw = noise.beachiness.sample(x, z)
  return raw < 0 ? raw * 100 : raw * 3 + 1
}

function sampleHillHeight(x, z) {
  return noise.hills.sample(x, z) * 20 + 15
}

function sampleHilliness(x, z) {
  return Math.tanh(noise.hilliness.sample(x, z)) / 2 + 0.5
}

function sampleRawTerrainDensity(x, y, z) {
  return noise.land3D.sample(x, y, z)
}

function sampleLand3DAmount(x, z) {
  let raw = Math.max(0, noise.land3DAmount.sample(x, z) + 0.3)
  return 5 * raw
  // return 20 * raw ** 10 + 5 * raw
}

function sampleBiome(x, z) {
  let offsetX = noise.biomeOffsetX.sample(x, z) * 15
  let offsetZ = noise.biomeOffsetZ.sample(x, z) * 15

  let temperature = noise.temperature.sample(x + offsetX, z + offsetZ)
  let humidity    = noise.humidity   .sample(x + offsetX, z + offsetZ)

  return biomeTableLookup(temperature, humidity)
}

function isNoodleCave(caviness, x, y, z)  {
  return Math.abs(noise.noodleCaveA.sample(x, y, z)) < caviness
      && Math.abs(noise.noodleCaveB.sample(x, y, z)) < caviness
}

function isCheeseCave(threshold, x, y, z) {
  return noise.cheeseCave.sample(x, y, z) < threshold
}
