import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { injectCanvasSize } from '../../../inject/inject-canvas-size';
import { createFramebuffer } from '../../../helper/core/create-framebuffer';
import { createVAO } from '../../../helper/mesh/create-vao';
import { constructPlaneGeometry } from '../../../helper/geometry/construct-plane-geometry';
import { constructTriangleGeometry } from '../../../helper/geometry/construct-triangle-geometry';
import { createProgram } from '../../../helper/core/create-program';
import depthVert from './shader/depth.vert';
import depthFrag from './shader/depth.frag';
import shadowVert from './shader/shadow.vert';
import shadowFrag from './shader/shadow.frag';

@Component({
  selector: 'app-shadow',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class Shadow {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;

  constructor() {
    const size = injectCanvasSize({ canvasRef: this.canvas });
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(-6, 4, 7),
    });
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const gl = canvas.getContext('webgl2');
      if (!gl) throw new Error('WebGL2 не поддерживается');

      gl.enable(gl.DEPTH_TEST);

      // --- Программа 1 ---
      // минимальная, только позиция вершины через световую матрицу, фрагментный пустой
      const depthProgram = createProgram({
        gl,
        vertex: depthVert,
        fragment: depthFrag,
      });
      const u_LightSpaceMatrix_d = gl.getUniformLocation(depthProgram, 'u_LightSpaceMatrix');
      const u_Model_d = gl.getUniformLocation(depthProgram, 'u_Model');
      if (!u_LightSpaceMatrix_d || !u_Model_d) throw new Error('depth: uniform не найден');
      // --- Программа 2 ---
      // полная, рисует сцену из камеры, читает карту теней, сравнивает глубины, змтемняет
      const shadowProgram = createProgram({ gl, vertex: shadowVert, fragment: shadowFrag });
      const u_Matrix_s = gl.getUniformLocation(shadowProgram, 'u_Matrix');
      const u_Model_s = gl.getUniformLocation(shadowProgram, 'u_Model');
      const u_LightSpaceMatrix_s = gl.getUniformLocation(shadowProgram, 'u_LightSpaceMatrix');
      const u_ShadowMap = gl.getUniformLocation(shadowProgram, 'u_ShadowMap');
      const u_LightDir = gl.getUniformLocation(shadowProgram, 'u_LightDir');
      const u_Color = gl.getUniformLocation(shadowProgram, 'u_Color');
      if (!u_Matrix_s || !u_Model_s || !u_LightSpaceMatrix_s || !u_ShadowMap || !u_LightDir || !u_Color) {
        throw new Error('shadow: uniform не найден');
      }

      // --- 1. Световая матрица (lightSpaceMatrix) — "камера света"
      // направление света => позиция "камера света" (отодвигаем источник назад по лучу)
      const lightDir = vec3.normalize(vec3.create(), vec3.fromValues(2.0, 4.0, 3.0));
      const lightPos = vec3.scale(vec3.create(), lightDir, 8); // отодвинуть от центра
      const lightTarget = vec3.fromValues(0, 0, 0); // свет смотрит в центр сцены

      const lightView = mat4.lookAt(mat4.create(), lightPos, lightTarget, vec3.fromValues(0, 1, 0));
      // ОРТО-проекция: границы должны ОХВАТЫВАТЬ всю сцену (иначе часть не попадёт в карту) (подбор под сцену)
      const lightProjection = mat4.ortho(mat4.create(), -6, 6, -6, 6, 0.1, 20);
      const lightSpaceMatrix = mat4.multiply(mat4.create(), lightProjection, lightView);

      // --- 2. Depth-framebuffer для карты теней
      const SHADOW_SIZE = 1024;
      const shadowFb = createFramebuffer({
        gl,
        width: SHADOW_SIZE,
        height: SHADOW_SIZE,
        destroyRef,
        depth: 'texture', // глубина в текстуру
        color: false, // цвет не нужен
      });

      // --- 3. Два прохода в render цикле
      const planeGeometry = constructPlaneGeometry();
      const plane = createVAO({
        gl,
        attributes: [
          {
            location: this.a_Position,
            srcData: planeGeometry.position,
            size: 3,
          },
          {
            location: this.a_Normal,
            srcData: planeGeometry.normal,
            size: 3,
          },
        ],
        indices: {
          srcData: planeGeometry.indices,
        },
      });

      const triangleGeometry = constructTriangleGeometry();
      const triangle = createVAO({
        gl,
        attributes: [
          {
            location: this.a_Position,
            srcData: triangleGeometry.position,
            size: 3,
          },
          {
            location: this.a_Normal,
            srcData: triangleGeometry.normal,
            size: 3,
          },
        ],
        indices: {
          srcData: triangleGeometry.indices,
        },
      });

      const objects = [
        {
          vao: triangle.vao,
          count: triangleGeometry.count,
          model: () => mat4.fromTranslation(mat4.create(), [0, 1.5, 0]), // поднять над полом
          color: vec3.fromValues(0.9, 0.3, 0.2), // треугольник — красноватый
        },
        {
          vao: plane.vao,
          count: planeGeometry.count,
          model: () => mat4.create(), // пол в начале координат
          color: vec3.fromValues(1.0, 1.0, 1.0), // пол — белый
        },
      ];

      let animationId = 0;

      const render = () => {
        const { width, height } = size();
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        // === Проход 1: карта теней (из света, в depth-текстуру) ===
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb.framebuffer);
        gl.viewport(0, 0, SHADOW_SIZE, SHADOW_SIZE);
        gl.clear(gl.DEPTH_BUFFER_BIT); // только глубина, цвета нет

        gl.useProgram(depthProgram);
        gl.uniformMatrix4fv(u_LightSpaceMatrix_d, false, lightSpaceMatrix);
        for (const { vao, count, model } of objects) {
          gl.bindVertexArray(vao);
          gl.uniformMatrix4fv(u_Model_d, false, model());
          gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        }

        // === Проход 2: сцена с тенями (из камеры, на экран) ===
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shadowProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shadowFb.depthTexture); // карта теней в слот 0
        gl.uniform1i(u_ShadowMap, 0);
        gl.uniformMatrix4fv(u_LightSpaceMatrix_s, false, lightSpaceMatrix);
        gl.uniform3fv(u_LightDir, lightDir);

        const aspect = canvas.width / canvas.height;
        const projection = mat4.perspective(mat4.create(), (Math.PI * 45) / 180, aspect, 0.1, 100);
        const viewProjection = mat4.multiply(mat4.create(), projection, viewMatrix());

        for (const { vao, count, model, color } of objects) {
          const m = model();
          gl.bindVertexArray(vao);
          gl.uniformMatrix4fv(u_Matrix_s, false, mat4.multiply(mat4.create(), viewProjection, m));
          gl.uniformMatrix4fv(u_Model_s, false, m);
          gl.uniform3fv(u_Color, color);
          gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        }
        animationId = requestAnimationFrame(render);
      };

      animationId = requestAnimationFrame(render);
      destroyRef.onDestroy(() => cancelAnimationFrame(animationId));
    });
  }
}
