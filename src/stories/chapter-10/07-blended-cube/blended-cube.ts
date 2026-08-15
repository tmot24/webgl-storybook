import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/mesh/create-vao';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';

@Component({
  selector: 'app-blended-cube',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class BlendedCube {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Color = 1;
  private readonly alpha = 0.5;

  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Координаты вершин и цвета
  private readonly points = [
    // Рисуется против часовой стрелки
    { coord: { x: 1.0, y: 1.0, z: 1.0 }, color: { r: 1.0, g: 1.0, b: 1.0, a: this.alpha } }, // v0
    { coord: { x: -1.0, y: 1.0, z: 1.0 }, color: { r: 1.0, g: 0.0, b: 1.0, a: this.alpha } }, // v1
    { coord: { x: -1.0, y: -1.0, z: 1.0 }, color: { r: 1.0, g: 0.0, b: 0.0, a: this.alpha } }, // v2
    { coord: { x: 1.0, y: -1.0, z: 1.0 }, color: { r: 1.0, g: 1.0, b: 0.0, a: this.alpha } }, // v3
    { coord: { x: 1.0, y: -1.0, z: -1.0 }, color: { r: 0.0, g: 1.0, b: 0.0, a: this.alpha } }, // v4
    { coord: { x: 1.0, y: 1.0, z: -1.0 }, color: { r: 0.0, g: 1.0, b: 1.0, a: this.alpha } }, // v5
    { coord: { x: -1.0, y: 1.0, z: -1.0 }, color: { r: 0.0, g: 0.0, b: 1.0, a: this.alpha } }, // v6
    { coord: { x: -1.0, y: -1.0, z: -1.0 }, color: { r: 0.0, g: 0.0, b: 0.0, a: this.alpha } }, // v7
  ];
  // Индексы вершин
  private readonly indicesPoint = [
    [0, 1, 2, 0, 2, 3], // передняя
    [0, 3, 4, 0, 4, 5], // правая
    [0, 5, 6, 0, 6, 1], // верхняя
    [1, 6, 7, 1, 7, 2], // левая
    [7, 4, 3, 7, 3, 2], // нижняя
    [4, 7, 6, 4, 6, 5], // задняя
  ];

  constructor() {
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(3, 3, 7),
    });

    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        const vertexData = new Float32Array(
          this.points.flatMap(({ coord: { x, y, z }, color: { r, g, b, a } }) => [x, y, z, r, g, b, a]),
        );
        const indicesData = new Uint16Array(this.indicesPoint.flatMap((indices) => indices));
        const count = indicesData.length; // Число индексов (так как отрисовка идёт по индексам)

        const DATA_BYTE = vertexData.BYTES_PER_ELEMENT; // 4 — не хардкодим магическое число

        const { buffers, vao, indexBuffer } = createVAO({
          gl,
          attributes: [
            {
              location: this.a_Position,
              srcData: vertexData,
              size: 3, // x, y, z
              stride: 7 * DATA_BYTE, // [x, y, z, r, g, b, a].length = 7 полный шаг вершины
              offset: 0, // позиция в начале
            },
            {
              location: this.a_Color,
              srcData: vertexData,
              size: 4, // r, g, b, a
              stride: 7 * DATA_BYTE, // [x, y, z, r, g, b, a].length = 7 полный шаг вершины
              offset: 3 * DATA_BYTE, // [x, y, z].length = 3 пропустить x, y, z
            },
          ],
          indices: {
            srcData: indicesData,
          },
        });

        const u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
        if (!u_Matrix) throw new Error('uniform u_Matrix не найден');

        // Активировать функцию альфа-смешивания
        gl.enable(gl.BLEND);
        // Определить, как должно производиться смешивание
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          if (indexBuffer) {
            gl.deleteBuffer(indexBuffer);
          }
          gl.deleteVertexArray(vao);
        });
        return { count, vao, u_Matrix };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix } }) => {
        const aspect = width / height;
        const radian = (Math.PI * 30) / 180; // Преобразование в радианы
        const projectionMatrix = mat4.perspective(mat4.create(), radian, aspect, 1, 100);
        // Общая матрица для всех объектов
        const viewProjection = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix());
        // VAO тоже один на все — привязываем один раз до цикла
        gl.bindVertexArray(vao);

        gl.uniformMatrix4fv(u_Matrix, false, viewProjection);
        /**
         * Разрешает или запрещает запись в буффер глубины
         * */
        gl.depthMask(false); // перед drawElements прозрачного объекта:
        /**
         * Выполняет шейдер и рисует геометрическую фигуру в указанном режиме mode, используя индексы в буферном
         * объекте типа gl.ELEMENT_ARRAY_BUFFER
         * Параметры:
         * mode - определяет тип фигуры: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, gl.TRIANGLES,
         * gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN;
         * count - число индексов, участвующих в рисовании (целое);
         * type - определяет тип индексов: gl.UNSIGNED_BYTE (для Uint8Array) или gl.UNSIGNED_SHORT (для Uint16Array);
         * offset - определяет смещение в массиве индексов в байтах, откуда следует начать рисование.
         * */
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true); // вернуть для последующих непрозрачных объектов
      },
    });
  }
}
