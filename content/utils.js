// RANDOM CONSTANTS IDK (they need to be used in the web workers)

let renderDistance = 16

// cannot be bigger than 32, 256 or many things will die
const CHUNK_SIZE = 32, CHUNK_HEIGHT = 256

const CHUNK_LAYER_LEN = CHUNK_SIZE ** 2, CHUNK_LEN = CHUNK_LAYER_LEN * CHUNK_HEIGHT

const FACE_BUFFER_PADDING = CHUNK_SIZE * 4

// UTILITIES

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x))
}

function id(id) {
  return document.getElementById(id)
}

function smoothstep(x) {
  return x * x * (3 - 2 * x)
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
  }
  return hash | 0
}

function seededRandom(s, int = false) {
  let div = int ? 1 : 0x100000000

  return () => {
    s |= 0
    s = s + 0x9e3779b9 | 0
    let t = s ^ s >>> 16
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ t >>> 15
    t = Math.imul(t, 0x735a2d97)
    return ((t ^ t >>> 15) >>> 0) / div
  }
}
