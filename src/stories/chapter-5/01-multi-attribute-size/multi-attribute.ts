import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';

@Component({
  selector: 'app-multi-attribute',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class MultiAttribute {
  private readonly a_Position = 0;
  private readonly a_PointSize = 1;
  private readonly a_Color = 2;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, destroyRef }) => {
        const points = [
          // Рисуется против часовой стрелки
          { coord: { x: 0.0, y: 0.5 }, size: 50, color: { r: 0.0, g: 0.0, b: 1.0, a: 1.0 } }, // центр верх
          { coord: { x: -0.5, y: -0.5 }, size: 100, color: { r: 0.0, g: 1.0, b: 0.0, a: 1.0 } }, // левый низ
          { coord: { x: 0.5, y: -0.5 }, size: 150, color: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 } }, // правый низ
        ];

        const srcData = new Float32Array(
          points.flatMap(({ coord: { x, y }, size, color: { r, g, b, a } }) => [x, y, size, r, g, b, a]),
        );
        const n = points.length; // Число вершин

        const DATA_BYTE = srcData.BYTES_PER_ELEMENT; // 4 — не хардкодим магическое число

        const { buffers, vao } = createVAO({
          gl,
          attributes: [
            {
              location: this.a_Position,
              srcData,
              size: 2, // x, y
              stride: 7 * DATA_BYTE, // [x, y, size, r, g, b, a].length = 7 полный шаг вершины
              offset: 0, // позиция в начале
            },
            {
              location: this.a_PointSize,
              srcData,
              size: 1, // size
              stride: 7 * DATA_BYTE,
              offset: 2 * DATA_BYTE, // [x, y].length = 2 пропустить x, y
            },
            {
              location: this.a_Color,
              srcData,
              size: 4, // r, g, b, a
              stride: 7 * DATA_BYTE,
              offset: 3 * DATA_BYTE, // [x, y, size].length = 3 пропустить x, y, size
            },
          ],
        });

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          gl.deleteVertexArray(vao);
        });
        return { n, vao };
      },
      render: ({ gl, setup: { n, vao } }) => {
        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        gl.drawArrays(gl.POINTS, 0, n);
      },
    });
  }
}
