importScripts("../perlin_2d.js", "../perlin_3d.js")

let noise

function initNoise(seed) {
  let s = 0.2 // temporary noise scale

  noise = {
    land: new OctavePerlin2D(seed, [
      { scale: s * 1000, magnitude: 1 },
      { scale: s * 400, magnitude: 0.4 }
    ]),
    landSmall: new Perlin3D(seed),
    humidity: new OctavePerlin2D(seed, [
      { scale: s * 1500, magnitude: 1 },
      { scale: s * 700, magnitude: 0.5 },
      { scale: 32, magnitude: 0.02 },
      { scale: 6, magnitude: 0.005 }
    ]),
    temperature: new OctavePerlin2D(seed, [
      { scale: s * 1500, magnitude: 1 },
      { scale: s * 700, magnitude: 0.5 },
      { scale: 32, magnitude: 0.02 },
      { scale: 6, magnitude: 0.005 }
    ])
  }
}

function sampleApproxTerrainHeight(x, z) {
  return noise.land.sample(x, z) * 50 + 80
}

function sampleBiome(x, z) {
  let temp = noise.temperature.sample(x, z), humidity = noise.humidity.sample(x, z)
  return biomeTableLookup(temp, humidity)
}
