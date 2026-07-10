import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/create-vao';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { CUBE_FACE } from '../../../data/cube-face';
import { getRadianFromDegree } from '../../../helper/get-radian-from-degree';

@Component({
  selector: 'app-joint-model',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class JointModel {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  protected arm1Angle = input<number>(0);
  protected joint1Angle = input<number>(0);

  private readonly faces = CUBE_FACE;

  constructor() {
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(-10.0, 4.0, 15.0),
      center: vec3.fromValues(0.0, 4.0, 0.0),
    });

    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, program, destroyRef }) => {
        const vertexData = new Float32Array(
          this.faces.flatMap(({ normal, points }) =>
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

        const u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');
        if (!u_LightDirection) throw new Error('uniform u_LightDirection не найден');
        const lightDirection = vec3.fromValues(0.5, 3.0, 1.0);
        vec3.normalize(lightDirection, lightDirection);
        gl.uniform3fv(u_LightDirection, lightDirection);

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
        // VAO тоже один на все — привязываем один раз до цикла
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u_Matrix, false, viewProjection);

        // Размеры сегментов
        const arm1 = { length: 3.5, width: 0.4 };
        const joint1 = { length: 3.5, width: 0.7 };
        // В данных куп единичный с высотой 2 от -1 до 1, поэтому масштаб пл Y = length/2, чтобы получить нужную длину
        const cubeHeight = 2.0;

        // 1) Рука (родитель), основание руки на полу (y=0), вращается вокруг Y
        const arm1Base = mat4.create();
        mat4.translate(arm1Base, arm1Base, vec3.fromValues(0.0, 0.0, 0.0)); // T: крепление к полу
        mat4.rotateY(arm1Base, arm1Base, getRadianFromDegree(this.arm1Angle())); // R: поворот руки

        // 2) Геометрия руки: поднять так, чтобы низ куба был в основании, и отмасштабировать
        const arm1Model = mat4.clone(arm1Base);
        // arm1.length / 2 — это про СМЕЩЕНИЕ (translate), деление пополам геометрическое.
        mat4.translate(arm1Model, arm1Model, vec3.fromValues(0.0, arm1.length / 2, 0.0)); // низ куба в точку поворота
        // arm1.length / cubeHeight — это про МАСШТАБ (scale), перевод единиц
        mat4.scale(arm1Model, arm1Model, vec3.fromValues(arm1.width, arm1.length / cubeHeight, arm1.width));
        drawSegment(arm1Model);

        // 1) Сустав (ребёнок), наследует arm1Base (без геометрического масштаба!), крепиться ВЕРХУ руки
        const joint1Base = mat4.clone(arm1Base); // наследование родителя
        mat4.translate(joint1Base, joint1Base, vec3.fromValues(0.0, arm1.length, 0.0)); // подняться на всю длину руки
        mat4.rotateZ(joint1Base, joint1Base, getRadianFromDegree(this.joint1Angle())); // R: поворот сустава

        // 2) Геометрия
        const joint1Model = mat4.clone(joint1Base);
        mat4.translate(joint1Model, joint1Model, vec3.fromValues(0.0, joint1.length / 2, 0));
        mat4.scale(joint1Model, joint1Model, vec3.fromValues(joint1.width, joint1.length / cubeHeight, joint1.width));
        drawSegment(joint1Model);

        function drawSegment(modelMatrix: mat4) {
          // Делает inverse + transpose (транспонированная обратная матрица)
          const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
          gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
          gl.uniformMatrix3fv(u_NormalMatrix, false, normalMatrix);
          gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        }
      },
    });
  }
}
