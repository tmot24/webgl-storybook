import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';

@Component({
  selector: 'app-translated-triangle',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class TranslatedTriangle {
  // Ссылка на атрибут layout(location = 0) in vec4 a_Position;
  private readonly a_Position = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  offsetX = input<number>(0);
  offsetY = input<number>(0);

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

        const { buffers, vao } = createVAO({
          gl,
          attributes: [{ location: this.a_Position, srcData: vertices, size }],
        });

        const u_Translation = gl.getUniformLocation(program, 'u_Translation');
        if (!u_Translation) throw new Error('uniform u_Translation не найден');

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          gl.deleteVertexArray(vao); // VAO - тоже GPU-ресурс - удаляем
        });
        return { n, vao, u_Translation };
      },
      render: ({ gl, setup: { n, vao, u_Translation } }) => {
        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        // w - как 0.0, потому что в вершинном шейдере уже есть 1.0.
        // Если передать 1.0, то фигура станет в 2 раза меньше, так как произойдёт деление
        gl.uniform4f(u_Translation, this.offsetX(), this.offsetY(), 0.0, 0.0);
        gl.drawArrays(gl.TRIANGLES, 0, n);
      },
    });
  }
}
