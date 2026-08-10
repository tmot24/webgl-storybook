import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/mesh/create-vao';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { CUBE_FACE } from '../../../data/cube-face';
import { computeAABB } from '../../../helper/hit-box/compute-aabb';
import { rayIntersectsBox } from '../../../helper/hit-box/ray-intersects-box';
import { ndcToWorld } from '../../../helper/hit-box/ndc-to-world';
import { cssToNdc } from '../../../helper/hit-box/css-to-ndc';

@Component({
  selector: 'app-pick-object',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  template: ` <canvas #canvasRef (click)="clickHandler($event)"></canvas>`,
})
export class PickObject {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  private readonly faces = CUBE_FACE;

  // Поле компонента: обновляем в render, читаем в обработчике клика
  private readonly viewProjection = mat4.create();
  // Необходимо для изменения положения объекта
  private readonly modelMatrix = mat4.create();
  // HitBox ограничивающие вектора
  private boxMin = vec3.create();
  private boxMax = vec3.create();

  constructor() {
    const { viewMatrix } = injectOrbitCamera({
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

        const allPoints = this.faces.flatMap(({ points }) => points);
        const { boxMin, boxMax } = computeAABB({ points: allPoints });
        this.boxMin = boxMin;
        this.boxMax = boxMax;

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

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          if (indexBuffer) {
            gl.deleteBuffer(indexBuffer);
          }
          gl.deleteVertexArray(vao);
        });
        return { count, vao, u_Matrix };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix } }) => {
        const aspect = width / height;
        const radian = (Math.PI * 30) / 180; // Преобразование в радианы
        const projectionMatrix = mat4.perspective(mat4.create(), radian, aspect, 1, 100);
        // Общая матрица для всех объектов
        const viewProjection = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix());

        // Сохраняем актуальную матрицу для клика
        mat4.copy(this.viewProjection, viewProjection);

        // VAO тоже один на все — привязываем один раз до цикла
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u_Matrix, false, viewProjection);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      },
    });
  }

  /**
   * Клик мыши превращаем в луч, идущий из камеры в глубину сцены, и проверяем, задевает ли этот луч объект
   * */
  protected clickHandler(event: MouseEvent) {
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    // Шаг 1: CSS-пиксели => NDC [-1, 1] (Y инвертируем) NDC = Normalized Device Coordinates
    const { ndcX, ndcY } = cssToNdc({ event, rect });
    // Шаг 2: NDC => луч в мире через обратную viewProjection
    const inverseVP = mat4.invert(mat4.create(), this.viewProjection);
    if (!inverseVP) return;

    const nearPoint = ndcToWorld({ ndcX, ndcY, ndcZ: -1, inverseVP });
    const farPoint = ndcToWorld({ ndcX, ndcY, ndcZ: 1, inverseVP });

    const rayOrigin = nearPoint;
    const rayDir = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), farPoint, nearPoint));

    const inverseModel = mat4.invert(mat4.create(), this.modelMatrix);
    if (!inverseModel) return;

    // Точку origin трансформируем как точку - с учётом смещения
    const localOrigin = vec3.transformMat4(vec3.create(), rayOrigin, inverseModel);
    // Направление трансформируем БЕЗ смещения (это вектор, а не точка)
    const localDir = vec3.transformMat4(vec3.create(), vec3.add(vec3.create(), rayOrigin, rayDir), inverseModel);
    vec3.subtract(localDir, localDir, localOrigin);
    vec3.normalize(localDir, localDir);

    // Шаг 3: теперь проверяем против ИСХОДНОЙ коробки [-1,1]³ — в локальном пространстве куб снова осевой
    const hit = rayIntersectsBox({
      origin: localOrigin,
      dir: localDir,
      boxMin: this.boxMin,
      boxMax: this.boxMax,
    });

    if (hit) alert('Попал по кубу!');
  }
}
