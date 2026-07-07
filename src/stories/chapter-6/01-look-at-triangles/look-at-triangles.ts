import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { composeMatrix } from '../../../helper/compose-matrix';
import { composeModel } from '../../../helper/compose-model';

@Component({
  selector: 'app-look-at-triangles',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class LookAtTriangles {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Color = 1;

  // Рисуется против часовой стрелки
  private readonly points = [
    // Дальний зелёный треугольник
    { coord: { x: 0.0, y: 0.5, z: -0.4 }, color: { r: 0.4, g: 1.0, b: 0.4 } }, // верх
    { coord: { x: -0.5, y: -0.5, z: -0.4 }, color: { r: 0.4, g: 1.0, b: 0.4 } }, // лево
    { coord: { x: 0.5, y: -0.5, z: -0.4 }, color: { r: 1.0, g: 0.4, b: 0.4 } }, // право
    // Жёлтый треугольник в середине
    { coord: { x: 0.5, y: 0.4, z: -0.2 }, color: { r: 1.0, g: 0.4, b: 0.4 } }, // верх
    { coord: { x: -0.5, y: 0.4, z: -0.2 }, color: { r: 1.0, g: 1.0, b: 0.4 } }, // лево
    { coord: { x: 0.0, y: -0.6, z: -0.2 }, color: { r: 1.0, g: 1.0, b: 0.4 } }, // право
    // Ближний синий треугольник
    { coord: { x: 0.0, y: 0.5, z: 0.0 }, color: { r: 0.4, g: 0.4, b: 1.0 } }, // верх
    { coord: { x: -0.5, y: -0.5, z: 0.0 }, color: { r: 0.4, g: 0.4, b: 1.0 } }, // лево
    { coord: { x: 0.5, y: -0.5, z: 0.0 }, color: { r: 1.0, g: 0.4, b: 0.4 } }, // право
  ];

  protected angleAxisZ = input<number>(0);

  constructor() {
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(0.2, 0.25, 0.25),
    });

    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        const srcData = new Float32Array(
          this.points.flatMap(({ coord: { x, y, z }, color: { r, g, b } }) => [x, y, z, r, g, b]),
        );
        const count = this.points.length; // Число вершин

        const DATA_BYTE = srcData.BYTES_PER_ELEMENT; // 4 — не хардкодим магическое число

        const { buffers, vao } = createVAO({
          gl,
          attributes: [
            {
              location: this.a_Position,
              srcData,
              size: 3, // x, y, z
              stride: 6 * DATA_BYTE, // [x, y, z, r, g, b].length = 6 полный шаг вершины
              offset: 0, // позиция в начале
            },
            {
              location: this.a_Color,
              srcData,
              size: 3, // r, g, b
              stride: 6 * DATA_BYTE, // [x, y, z, r, g, b].length = 6 полный шаг вершины
              offset: 3 * DATA_BYTE, // [x, y, z].length = 3 пропустить x, y, z
            },
          ],
        });

        const u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
        if (!u_Matrix) throw new Error('uniform u_Matrix не найден');

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          gl.deleteVertexArray(vao);
        });
        return { count, vao, u_Matrix };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix } }) => {
        const aspect = width / height;
        // Projection
        const aspectMatrix = mat4.fromScaling(mat4.create(), [1 / aspect, 1, 1]);

        const radian = (Math.PI * this.angleAxisZ()) / 180; // Преобразование в радианы
        const modelMatrix = composeModel({
          rotate: {
            axis: vec3.fromValues(0, 0, 1),
            radian,
          },
        });

        const uMatrix = composeMatrix({
          projection: aspectMatrix,
          view: viewMatrix(),
          model: modelMatrix,
        });

        gl.uniformMatrix4fv(u_Matrix, false, uMatrix);

        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        gl.drawArrays(gl.TRIANGLES, 0, count);
      },
    });
  }
}
