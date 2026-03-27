/*
humidity ->   temperature |
0 1 2 3 4 5 6             V
1
2
3
4
5
6
*/

const biome_index = {
  // first number = temp, second = humidity
  "30": "plains",
  "32": "desert",
  "34": "stone",
  "41": "plains",
  "43": "desert",
  "45": "stone"
}

const biome_data = {
  "plains": {
    surface: "GRASS"
  },
  "desert": {
    surface: "SAND"
  },
  "stone": {
    surface: "STONE"
  }
}