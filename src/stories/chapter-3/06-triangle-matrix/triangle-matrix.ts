import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';

@Component({
  selector: 'app-rotated-triangle-matrix',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class TriangleMatrix {
  private readonly a_Position = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  offsetX = input<number>(0);
  offsetY = input<number>(0);
  angleAxisZ = input<number>(0);

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        const triangle = [
          // Рисуется против часовой стрелки
          { x: 0.0, y: 0.5 }, // центр верх
          { x: -0.5, y: -0.5 }, // левый низ
          { x: 0.5, y: -0.5 }, // правый низ
        ];

        const vertices = new Float32Array(triangle.flatMap(({ x, y }) => [x, y]));
        const n = triangle.length; // Число вершин
        const size = Object.keys(triangle[0]).length; // Число координат

        const { vertexBuffer, vao } = createVAO({ gl, location: this.a_Position, srcData: vertices, size });

        const u_xformMatrix = gl.getUniformLocation(program, 'u_xformMatrix');
        if (!u_xformMatrix) throw new Error('uniform u_xformMatrix не найден');

        destroyRef.onDestroy(() => {
          gl.deleteBuffer(vertexBuffer);
          gl.deleteVertexArray(vao); // VAO - тоже GPU-ресурс - удаляем
        });
        return { n, vao, u_xformMatrix };
      },
      render: ({ gl, setup: { n, vao, u_xformMatrix } }) => {
        const radian = (Math.PI * this.angleAxisZ()) / 180; // Преобразование в радианы
        const cosB = Math.cos(radian);
        const sinB = Math.sin(radian);

        // prettier-ignore
        const xformMatrix = new Float32Array([
          cosB, sinB, 0.0, 0.0,
          -sinB, cosB, 0.0, 0.0,
          0.0, 0.0, 1.0, 0.0,
          this.offsetX(), this.offsetY(), 0.0, 1.0,
        ]);

        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        /**
         * Записывает матрицу 4х4, находящуюся в массиве array, в uniform-переменную location
         * Параметры:
         * location - определяет uniform-переменную, куда будет записана матрица.
         * transpose - необходимость транспонирования матрицы.
         * array - определяет массив с матрицей 4х4 с порядком расположения элементов по столбцам.
         * */
        gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, n);
      },
    });
  }
}
