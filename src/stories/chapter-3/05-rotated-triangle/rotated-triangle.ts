import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';

@Component({
  selector: 'app-rotated-triangle',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class RotatedTriangle {
  // Ссылка на атрибут layout(location = 0) in vec4 a_Position;
  private readonly a_Position = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

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

        const u_CosBSinB = gl.getUniformLocation(program, 'u_CosBSinB');
        if (!u_CosBSinB) throw new Error('uniform u_CosB не найден');

        destroyRef.onDestroy(() => {
          gl.deleteBuffer(vertexBuffer);
          gl.deleteVertexArray(vao); // VAO - тоже GPU-ресурс - удаляем
        });
        return { n, vao, u_CosBSinB };
      },
      render: ({ gl, setup: { n, vao, u_CosBSinB } }) => {
        const radian = (Math.PI * this.angleAxisZ()) / 180; // Преобразование в радианы
        const cosB = Math.cos(radian);
        const sinB = Math.sin(radian);

        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        // Оптимальнее передавать вектор, а не каждое число отдельно
        gl.uniform2f(u_CosBSinB, cosB, sinB);
        gl.drawArrays(gl.TRIANGLES, 0, n);
      },
    });
  }
}
