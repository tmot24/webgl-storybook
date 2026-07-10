import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { CUBE_FACE } from '../../../data/cube-face';

@Component({
  selector: 'app-point-light-cube-fragment',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class PointLightCubeFragment {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  private readonly faces = CUBE_FACE;

  constructor() {
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(3.0, 3.0, 7.0),
    });

    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        const vertexData = new Float32Array(
          this.faces.flatMap(({ normal, points, color }) =>
            points.flatMap(({ x, y, z }) => [x, y, z, normal.x, normal.y, normal.z, 1, 0, 0]),
          ),
        );
        const DATA_BYTE = vertexData.BYTES_PER_ELEMENT; // 4 — не хардкодим магическое число
        const indicesData = new Uint16Array(
          this.faces.flatMap((_, faceIndex) => {
            const offset = faceIndex * 4;
            return [offset, offset + 1, offset + 2, offset, offset + 2, offset + 3];
          }),
        );
        const count = indicesData.length; // Число индексов (так как отрисовка идёт по индексам)
        const stride = 9 * DATA_BYTE; // [x, y, z, normal.x, normal.y, normal.z, r, g, b].length = 9 полный шаг вершины

        const { buffers, vao, indexBuffer } = createVAO({
          gl,
          attributes: [
            {
              location: this.a_Position,
              srcData: vertexData,
              size: 3, // x, y, z
              stride,
              offset: 0, // позиция в начале
            },
            {
              location: this.a_Normal,
              srcData: vertexData,
              size: 3, // normal.x, normal.y, normal.z
              stride,
              offset: 3 * DATA_BYTE, // [x, y, z].length = 3 пропустить x, y, z
            },
            {
              location: this.a_Color,
              srcData: vertexData,
              size: 3, // r, g, b
              stride,
              offset: 6 * DATA_BYTE, // [x, y, z, normal.x, normal.y, normal.z].length = 6 пропустить x, y, z и normal
            },
          ],
          indices: {
            srcData: indicesData,
          },
        });

        const u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
        if (!u_Matrix) throw new Error('uniform u_Matrix не найден');
        const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
        if (!u_ModelMatrix) throw new Error('uniform u_ModelMatrix не найден');
        const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
        if (!u_NormalMatrix) throw new Error('uniform u_NormalMatrix не найден');

        const u_Ambient = gl.getUniformLocation(program, 'u_Ambient');
        if (!u_Ambient) throw new Error('uniform u_Ambient не найден');
        // Цвет фонового света
        gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);

        const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
        if (!u_LightColor) throw new Error('uniform u_LightColor не найден');
        // Цвет от источника света
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

        const u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
        if (!u_LightPosition) throw new Error('uniform u_LightPosition не найден');
        gl.uniform3fv(u_LightPosition, vec3.fromValues(1.2, 2.0, 1.7));

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          if (indexBuffer) {
            gl.deleteBuffer(indexBuffer);
          }
          gl.deleteVertexArray(vao);
        });
        return { count, vao, u_Matrix, u_ModelMatrix, u_NormalMatrix };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix, u_ModelMatrix, u_NormalMatrix } }) => {
        const aspect = width / height;
        const radian = (Math.PI * 30) / 180; // Преобразование в радианы
        const projectionMatrix = mat4.perspective(mat4.create(), radian, aspect, 1, 100);
        // Общая матрица для всех объектов
        const viewProjection = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix());

        const modelMatrix = mat4.create();
        const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);

        // VAO тоже один на все — привязываем один раз до цикла
        gl.bindVertexArray(vao);

        gl.uniformMatrix4fv(u_Matrix, false, viewProjection);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
        gl.uniformMatrix3fv(u_NormalMatrix, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      },
    });
  }
}
