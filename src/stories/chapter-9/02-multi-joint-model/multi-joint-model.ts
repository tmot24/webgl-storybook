import { Component, ElementRef, input, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/mesh/create-vao';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { CUBE_FACE } from '../../../data/cube-face';
import { computeJointMatrices } from '../../../helper/matrix/compute-joint-matrices';

@Component({
  selector: 'app-multi-joint-model',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class MultiJointModel {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  protected upperArmAngle = input<number>(0);
  protected forearmAngle = input<number>(0);
  protected handAngle = input<number>(0);
  protected fingerAngle = input<number>(0);

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
            points.flatMap(({ coord: { x, y, z } }) => [x, y, z, normal.x, normal.y, normal.z, 1, 0, 0]),
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
        const shoulder = { height: 0.5, width: 1.5, depth: 1.5 };
        const upperArm = { height: 3.5, width: 0.4, depth: 0.4 };
        const forearm = { height: 3.5, width: 0.7, depth: 0.7 };
        const hand = { height: 0.5, width: 0.3, depth: 1 };
        const finger = { height: 0.7, width: 0.2, depth: 0.2 };
        // В данных куп единичный с высотой 2 от -1 до 1, поэтому масштаб пл Y = height/2, чтобы получить нужную длину
        const cubeHeight = 2.0;

        // Пол
        const { base: shoulderBase, model: shoulderModel } = computeJointMatrices({
          parentBase: mat4.create(), // родитель = мир (пол)
          offset: vec3.fromValues(0, 0, 0),
          rotation: { axis: [0, 1, 0], deg: 0 },
          segment: shoulder,
          cubeHeight,
        });
        this.drawSegment({ modelMatrix: shoulderModel, gl, count, u_ModelMatrix, u_NormalMatrix });

        // Плечо — от пола
        const { base: upperArmBase, model: upperArmModel } = computeJointMatrices({
          parentBase: shoulderBase,
          offset: vec3.fromValues(0, shoulder.height, 0),
          rotation: { axis: [0, 1, 0], deg: this.upperArmAngle() },
          segment: upperArm,
          cubeHeight,
        });
        this.drawSegment({ modelMatrix: upperArmModel, gl, count, u_ModelMatrix, u_NormalMatrix });

        // Предплечье — от верха плеча
        const { base: forearmBase, model: forearmModel } = computeJointMatrices({
          parentBase: upperArmBase,
          offset: vec3.fromValues(0, upperArm.height, 0), // подняться на длину плеча
          rotation: { axis: [0, 0, 1], deg: this.forearmAngle() },
          segment: forearm,
          cubeHeight,
        });
        this.drawSegment({ modelMatrix: forearmModel, gl, count, u_ModelMatrix, u_NormalMatrix });

        // Кисть - от верха предплечья
        const { base: handBase, model: handModel } = computeJointMatrices({
          parentBase: forearmBase,
          offset: vec3.fromValues(0, forearm.height, 0),
          rotation: { axis: [0, 1, 0], deg: this.handAngle() },
          segment: hand,
          cubeHeight,
        });
        this.drawSegment({ modelMatrix: handModel, gl, count, u_ModelMatrix, u_NormalMatrix });

        // Пальцы - оба от кисти, с боковым сдвигом
        const { model: leftFingerModel } = computeJointMatrices({
          parentBase: handBase,
          offset: vec3.fromValues(0, hand.height, -0.5),
          rotation: { axis: [1, 0, 0], deg: this.fingerAngle() },
          segment: finger,
          cubeHeight,
        });
        this.drawSegment({ modelMatrix: leftFingerModel, gl, count, u_ModelMatrix, u_NormalMatrix });
        const { model: rightFingerModel } = computeJointMatrices({
          parentBase: handBase,
          offset: vec3.fromValues(0, hand.height, 0.5),
          rotation: { axis: [1, 0, 0], deg: -this.fingerAngle() },
          segment: finger,
          cubeHeight,
        });
        this.drawSegment({ modelMatrix: rightFingerModel, gl, count, u_ModelMatrix, u_NormalMatrix });
      },
    });
  }

  private drawSegment({
    modelMatrix,
    gl,
    count,
    u_ModelMatrix,
    u_NormalMatrix,
  }: {
    modelMatrix: mat4;
    gl: WebGL2RenderingContext;
    count: number;
    u_ModelMatrix: WebGLUniformLocation;
    u_NormalMatrix: WebGLUniformLocation;
  }) {
    // Делает inverse + transpose (транспонированная обратная матрица)
    const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
    gl.uniformMatrix3fv(u_NormalMatrix, false, normalMatrix);
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
  }
}
