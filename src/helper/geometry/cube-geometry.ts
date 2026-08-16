import { CUBE_FACE } from '../../data/cube-face';

export interface CubeGeometry {
  position: Float32Array;
  color: Float32Array;
  texCoord: Float32Array;
  indices: Uint16Array;
  count: number;
}

// Строит геометрию куба: каждый атрибут - свой массив,
// чтобы материал мог взять только ему нужные атрибуты.
export function cubeGeometry(): CubeGeometry {
  const points = CUBE_FACE.flatMap(({ points }) => points);

  const position = new Float32Array(points.flatMap(({ coord: { x, y, z } }) => [x, y, z]));
  const color = new Float32Array(points.flatMap(({ color: { r, g, b } }) => [r, g, b]));
  const texCoord = new Float32Array(points.flatMap(({ texCoord: { u, v } }) => [u, v]));

  const indices = new Uint16Array(
    CUBE_FACE.flatMap((_, faceIndex) => {
      const offset = faceIndex * 4;
      return [offset, offset + 1, offset + 2, offset, offset + 2, offset + 3];
    }),
  );

  return { position, color, texCoord, indices, count: indices.length };
}
