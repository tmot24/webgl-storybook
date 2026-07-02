import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';
import { mat4 } from 'gl-matrix';

@Component({
  selector: 'app-rotating-triangle',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class RotatingTriangle {
  private readonly a_Position = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private angle = 0; // Накопительный угол (радианы) - состояние анимации
  protected speed = input<number>(0);
  protected offsetX = input<number>(0);
  protected offsetY = input<number>(0);

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

        const u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
        if (!u_Matrix) throw new Error('uniform u_Matrix не найден');

        destroyRef.onDestroy(() => {
          gl.deleteBuffer(vertexBuffer);
          gl.deleteVertexArray(vao); // VAO - тоже GPU-ресурс - удаляем
        });
        return { n, vao, u_Matrix };
      },
      animate: true,
      render: ({ gl, setup: { n, vao, u_Matrix }, delta }) => {
        // накопитель: прибавляем поворот за прошедший кадр
        this.angle += this.speed() * (delta / 1000) * 2 * Math.PI; // speed в оборотах в секунду
        const rotation = mat4.fromZRotation(mat4.create(), this.angle);
        // Принимает ReadonlyVec3, поэтому должны записать 0
        const translation = mat4.fromTranslation(mat4.create(), [this.offsetX(), this.offsetY(), 0]);

        const matrix = mat4.create(); // Единичная матрица
        mat4.multiply(matrix, rotation, translation); // R × T — явно, обратный эффект (поворот вокруг центра)

        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        gl.uniformMatrix4fv(u_Matrix, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, n);
      },
    });
  }
}
