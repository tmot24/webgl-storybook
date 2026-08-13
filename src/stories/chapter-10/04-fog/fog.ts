import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/mesh/create-vao';
import { mat4, vec2, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { CUBE_FACE } from '../../../data/cube-face';

@Component({
  selector: 'app-fog',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class Fog {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  private readonly faces = CUBE_FACE;

  protected near = input<number>(0);
  protected far = input<number>(0);

  constructor() {
    const { viewMatrix, eyePoint } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(3, 3, 7),
    });

    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        const vertexData = new Float32Array(
          this.faces.flatMap(({ normal, points, color }) =>
            points.flatMap(({ x, y, z }) => [x, y, z, normal.x, normal.y, normal.z, color.r, color.g, color.b]),
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
        const u_Ambient = gl.getUniformLocation(program, 'u_Ambient');
        if (!u_Ambient) throw new Error('uniform u_Ambient не найден');
        const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
        if (!u_LightColor) throw new Error('uniform u_LightColor не найден');
        const u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');
        if (!u_LightDirection) throw new Error('uniform u_LightDirection не найден');

        const lightDirection = vec3.fromValues(0.5, 3.0, 1.0);
        vec3.normalize(lightDirection, lightDirection);
        gl.uniform3fv(u_LightDirection, lightDirection);

        // Цвет фонового света
        gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);
        // Цвет от источника света
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

        const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
        if (!u_ModelMatrix) throw new Error('uniform u_ModelMatrix не найден');
        const u_FogColor = gl.getUniformLocation(program, 'u_FogColor');
        if (!u_FogColor) throw new Error('uniform u_FogColor не найден');
        const u_FogDist = gl.getUniformLocation(program, 'u_FogDist');
        if (!u_FogDist) throw new Error('uniform u_FogDist не найден');
        const u_Eye = gl.getUniformLocation(program, 'u_Eye');
        if (!u_Eye) throw new Error('uniform u_Eye не найден');

        // Цвет тумана
        const fogColor = vec3.fromValues(0.137, 0.231, 0.423);
        // Определить цвет очистки и включить удаление невидимых поверхностей
        gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0);

        gl.uniform3fv(u_FogColor, fogColor);

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          if (indexBuffer) {
            gl.deleteBuffer(indexBuffer);
          }
          gl.deleteVertexArray(vao);
        });
        return { count, vao, u_Matrix, u_ModelMatrix, u_Eye, u_FogDist };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix, u_ModelMatrix, u_Eye, u_FogDist } }) => {
        const aspect = width / height;
        const radian = (Math.PI * 30) / 180; // Преобразование в радианы
        const projectionMatrix = mat4.perspective(mat4.create(), radian, aspect, 1, 100);
        // Общая матрица для всех объектов
        const viewProjection = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix());
        // VAO тоже один на все — привязываем один раз до цикла
        gl.bindVertexArray(vao);

        const eye = eyePoint();
        gl.uniform4f(u_Eye, eye[0], eye[1], eye[2], 1.0); // явный vec4, w=1
        gl.uniform2fv(u_FogDist, vec2.fromValues(this.near(), this.far()));

        gl.uniformMatrix4fv(u_ModelMatrix, false, mat4.create());
        gl.uniformMatrix4fv(u_Matrix, false, viewProjection);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      },
    });
  }
}
