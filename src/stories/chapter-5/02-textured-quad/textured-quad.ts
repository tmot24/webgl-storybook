import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';
import sea from '../../../image/sea.jpeg';
import { createTexture } from '../../../helper/create-texture';
import { mat4 } from 'gl-matrix';

@Component({
  selector: 'app-textured-quad',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class TexturedQuad {
  private readonly a_Position = 0;
  private readonly a_TexCoord = 1;
  private readonly textureSlot = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        // const points = [
        //   // Рисуется против часовой стрелки
        //   { coord: { x: -0.5, y: 0.5 }, texCoord: { u: 0.0, v: 1.0 } }, // левый верх
        //   { coord: { x: -0.5, y: -0.5 }, texCoord: { u: 0.0, v: 0.0 } }, // левый низ
        //   { coord: { x: 0.5, y: 0.5 }, texCoord: { u: 1.0, v: 1.0 } }, // правый верх
        //   { coord: { x: 0.5, y: -0.5 }, texCoord: { u: 1.0, v: 0.0 } }, // правый низ
        // ];
        const points = [
          // Рисуется против часовой стрелки
          { coord: { x: -0.5, y: 0.5 }, texCoord: { u: -0.3, v: 1.7 } }, // левый верх
          { coord: { x: -0.5, y: -0.5 }, texCoord: { u: -0.3, v: -0.2 } }, // левый низ
          { coord: { x: 0.5, y: 0.5 }, texCoord: { u: 1.7, v: 1.7 } }, // правый верх
          { coord: { x: 0.5, y: -0.5 }, texCoord: { u: 1.7, v: -0.2 } }, // правый низ
        ];

        const srcData = new Float32Array(points.flatMap(({ coord: { x, y }, texCoord: { u, v } }) => [x, y, u, v]));
        const count = points.length; // Число вершин

        const DATA_BYTE = srcData.BYTES_PER_ELEMENT; // 4 — не хардкодим магическое число

        const { buffers, vao } = createVAO({
          gl,
          attributes: [
            {
              location: this.a_Position,
              srcData,
              size: 2, // x, y
              stride: 4 * DATA_BYTE, // [x, y, u, v].length = 4 полный шаг вершины
              offset: 0, // позиция в начале
            },
            {
              location: this.a_TexCoord,
              srcData,
              size: 2, // u, v
              stride: 4 * DATA_BYTE,
              offset: 2 * DATA_BYTE, // [x, y].length = 2 пропустить x, y
            },
          ],
        });

        const u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
        if (!u_Matrix) throw new Error('uniform u_Matrix не найден');

        const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        if (!u_Sampler) throw new Error('uniform u_Sampler не найден');

        const { texture, isReadyTexture, slot } = createTexture({
          gl,
          src: sea,
          slot: this.textureSlot,
          // generateMipmap: true,
        });
        // Определить указатель на текстурный слот
        gl.uniform1i(u_Sampler, slot);

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          gl.deleteVertexArray(vao);
          gl.deleteTexture(texture);
        });
        return { count, vao, u_Sampler, u_Matrix, isReadyTexture };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix, isReadyTexture } }) => {
        if (isReadyTexture()) {
          const aspect = width / height;
          const aspectScale = mat4.fromScaling(mat4.create(), [1 / aspect, 1, 1]);

          gl.uniformMatrix4fv(u_Matrix, false, aspectScale);

          gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
        }
      },
    });
  }
}
