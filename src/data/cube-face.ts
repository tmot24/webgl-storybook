export const CUBE_FACE = [
  // front
  {
    normal: { x: 0, y: 0, z: 1 },
    color: { r: 1, g: 0, b: 0 },
    points: [
      { x: 1, y: 1, z: 1 }, // v0
      { x: -1, y: 1, z: 1 }, // v1
      { x: -1, y: -1, z: 1 }, // v2
      { x: 1, y: -1, z: 1 }, // v3
    ],
  },
  // right
  {
    normal: { x: 1, y: 0, z: 0 },
    color: { r: 0, g: 1, b: 0 },
    points: [
      { x: 1, y: 1, z: 1 }, // v0
      { x: 1, y: -1, z: 1 }, // v3
      { x: 1, y: -1, z: -1 }, // v4
      { x: 1, y: 1, z: -1 }, // v5
    ],
  },
  // up
  {
    normal: { x: 0, y: 1, z: 0 },
    color: { r: 0, g: 0, b: 1 },
    points: [
      { x: 1, y: 1, z: 1 }, // v0
      { x: 1, y: 1, z: -1 }, // v5
      { x: -1, y: 1, z: -1 }, // v6
      { x: -1, y: 1, z: 1 }, // v1
    ],
  },
  // left
  {
    normal: { x: -1, y: 0, z: 0 },
    color: { r: 1, g: 1, b: 0 },
    points: [
      { x: -1, y: 1, z: 1 }, // v1
      { x: -1, y: 1, z: -1 }, // v6
      { x: -1, y: -1, z: -1 }, // v7
      { x: -1, y: -1, z: 1 }, // v2
    ],
  },
  // down
  {
    normal: { x: 0, y: -1, z: 0 },
    color: { r: 1, g: 0, b: 1 },
    points: [
      { x: -1, y: -1, z: -1 }, // v7
      { x: 1, y: -1, z: -1 }, // v4
      { x: 1, y: -1, z: 1 }, // v3
      { x: -1, y: -1, z: 1 }, // v2
    ],
  },
  // back
  {
    normal: { x: 0, y: 0, z: -1 },
    color: { r: 0, g: 1, b: 1 },
    points: [
      { x: 1, y: -1, z: -1 }, // v4
      { x: -1, y: -1, z: -1 }, // v7
      { x: -1, y: 1, z: -1 }, // v6
      { x: 1, y: 1, z: -1 }, // v5
    ],
  },
];
