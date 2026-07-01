import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';

@Component({
  selector: 'app-hello-quad',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class HelloQuad {
  // Ссылка на атрибут layout(location = 0) in vec4 a_Position;
  private readonly a_Position = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, destroyRef }) => {
        const quad = [
          { x: -0.5, y: 0.5 }, // левый верх
          { x: -0.5, y: -0.5 }, // левый низ
          { x: 0.5, y: 0.5 }, // правый верх
          { x: 0.5, y: -0.5 }, // правый низ
        ];
        const vertices = new Float32Array(quad.flatMap(({ x, y }) => [x, y]));
        const n = quad.length; // Число вершин
        const size = 2; // Число координат

        const { vertexBuffer, vao } = createVAO({ gl, location: this.a_Position, srcData: vertices, size });

        destroyRef.onDestroy(() => {
          gl.deleteBuffer(vertexBuffer);
          gl.deleteVertexArray(vao); // VAO - тоже GPU-ресурс - удаляем
        });
        return { n, vao };
      },
      render: ({ gl, setup: { n, vao } }) => {
        gl.bindVertexArray(vao); // одна строка вместо перепривязки буфера и атрибутов
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
      },
    });
  }
}
