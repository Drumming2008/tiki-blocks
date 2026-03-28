importScripts("../perlin_2d.js", "../perlin_3d.js")

let noise

function initNoise(seed) {
  let s = 0.5 // temporary noise scale

  let random = seededRandom(seed, true)

  noise = {
    land: new OctavePerlin2D(random(), [
      { scale: s * 1000, magnitude: 1 },
      { scale: s * 400, magnitude: 0.4 }
    ]),
    land3D: new OctavePerlin3D(random(), [
      { scale: 10, magnitude: 1 }
    ]),
    humidity: new OctavePerlin2D(random(), [
      { scale: s * 1500, magnitude: 1 },
      { scale: s * 700, magnitude: 0.5 },
      { scale: 32, magnitude: 0.02 },
      { scale: 6, magnitude: 0.005 }
    ]),
    temperature: new OctavePerlin2D(random(), [
      { scale: s * 1500, magnitude: 1 },
      { scale: s * 700, magnitude: 0.5 },
      { scale: 32, magnitude: 0.02 },
      { scale: 6, magnitude: 0.005 }
    ])
  }
}

const land3DAmount = 20
const dirtLayerThickness = 3

function sampleApproxTerrainHeight(x, z) {
  return noise.land.sample(x, z) * 50 + 80
}

function sampleRawTerrainDensity(x, y, z) {
  return noise.land3D.sample(x, y, z)
}

function sampleBiome(x, z) {
  let temp = noise.temperature.sample(x, z), humidity = noise.humidity.sample(x, z)
  return biomeTableLookup(temp, humidity)
}
