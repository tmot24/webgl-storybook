import { Component, ElementRef, signal, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';
import { createVAO } from '../../../helper/mesh/create-vao';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { CUBE_FACE } from '../../../data/cube-face';
import { ndcToWorld } from '../../../helper/hit-box/ndc-to-world';
import { cssToNdc } from '../../../helper/hit-box/css-to-ndc';
import { rayIntersectsTriangle } from '../../../helper/hit-box/ray-intersects-triangle';

@Component({
  selector: 'app-pick-face',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class PickFace {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  private readonly faces = CUBE_FACE;

  // Поле компонента: обновляем в render, читаем в обработчике клика
  private readonly viewProjection = mat4.create();

  private readonly selectedFace = signal<number | undefined>(undefined);

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
        const u_Highlight = gl.getUniformLocation(program, 'u_Highlight');
        if (!u_Highlight) throw new Error('uniform u_Highlight не найден');

        const lightDirection = vec3.fromValues(0.5, 3.0, 1.0);
        vec3.normalize(lightDirection, lightDirection);
        gl.uniform3fv(u_LightDirection, lightDirection);

        // Цвет фонового света
        gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);
        // Цвет от источника света
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

        const canvas = this.canvas().nativeElement;
        const clickHandler = (event: MouseEvent) => {
          const { ndcX, ndcY } = cssToNdc({ event, rect: canvas.getBoundingClientRect() });

          const inverseVP = mat4.invert(mat4.create(), this.viewProjection);
          if (!inverseVP) return;

          const nearPoint = ndcToWorld({ ndcX, ndcY, ndcZ: -1, inverseVP });
          const farPoint = ndcToWorld({ ndcX, ndcY, ndcZ: 1, inverseVP });
          const origin = nearPoint;
          const dir = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), farPoint, nearPoint));

          const face = this.pickFace({ origin, dir });
          // toggle: клик по уже выбранной грани - снимает выбор; по новой - выбираем; мимо - снимаем
          this.selectedFace.update((current) => (current === face ? undefined : face));
        };

        canvas.addEventListener('click', clickHandler);

        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => gl.deleteBuffer(buffer));
          if (indexBuffer) {
            gl.deleteBuffer(indexBuffer);
          }
          gl.deleteVertexArray(vao);
          canvas.removeEventListener('click', clickHandler);
        });
        return { count, vao, u_Matrix, u_Highlight };
      },
      render: ({ gl, width, height, setup: { count, vao, u_Matrix, u_Highlight } }) => {
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

        // подписка на сигнал, перекраска при клике
        const selected = this.selectedFace();

        // рисуем каждую грань отдельно: 6 индексов, со смещением в индексном буфере
        this.faces.forEach((_, faceIndex) => {
          // подсветка включена, если это выбранная грань
          gl.uniform1i(u_Highlight, faceIndex === selected ? 1 : 0);

          // смещение в БАЙТАХ: 6 индексов на грань * 2 байта (Uint16) * номер грани
          const byteOffset = faceIndex * 6 * Uint16Array.BYTES_PER_ELEMENT;
          gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, byteOffset);
        });
      },
    });
  }

  private pickFace({ origin, dir }: { origin: vec3; dir: vec3 }) {
    let nearestT = Infinity;
    let nearestFace: number | undefined = undefined;

    this.faces.forEach((face, faceIndex) => {
      // грань - это quad из 4 точек, режем на 2 треугольника (0, 1, 2) и (0, 2, 3)
      const p = face.points.map(({ x, y, z }) => vec3.fromValues(x, y, z));
      const triangles = [
        [p[0], p[1], p[2]],
        [p[0], p[2], p[3]],
      ];

      triangles.forEach(([v0, v1, v2]) => {
        const t = rayIntersectsTriangle({ origin, dir, v0, v1, v2 });
        // ближе предыдущего? запоминаем эту грань
        if (t !== null && t < nearestT) {
          nearestT = t;
          nearestFace = faceIndex;
        }
      });
    });

    return nearestFace;
  }
}
