import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { constructCubeGeometry } from '../../../helper/geometry/construct-cube-geometry';
import { injectCanvasSize } from '../../../inject/inject-canvas-size';
import { createProgram } from '../../../helper/core/create-program';
import { createVAO } from '../../../helper/mesh/create-vao';
import { createTexture } from '../../../helper/mesh/create-texture';
import sea from '../../../image/sea.jpeg';
import { createFramebuffer } from '../../../helper/core/create-framebuffer';
import { composeMatrix } from '../../../helper/matrix/compose-matrix';
import { composeModel } from '../../../helper/matrix/compose-model';

@Component({
  selector: 'app-framebuffer',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class Framebuffer {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_TexCoord = 1;
  private readonly textureSlot = 0;

  constructor() {
    const size = injectCanvasSize({ canvasRef: this.canvas });
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(3, 3, 7),
    });
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const gl = canvas.getContext('webgl2');
      if (!gl) throw new Error('WebGL2 не поддерживается');

      gl.enable(gl.DEPTH_TEST);

      // одна программа на оба прохода - меши текстурированные одинаково
      const program = createProgram({
        gl,
        vertex: vertexSource,
        fragment: fragmentSource,
      });
      const u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
      if (!u_Matrix) throw new Error('uniform u_Matrix не найден');
      const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
      if (!u_Sampler) throw new Error('uniform u_Sampler не найден');

      gl.useProgram(program);
      gl.uniform1i(u_Sampler, this.textureSlot); // оба прохода читают из слота 0, меняем лиш привязанную текстуру

      /**
       * Геометрия куба
       * */
      const cube = constructCubeGeometry();
      const cubeVAO = createVAO({
        gl,
        attributes: [
          { location: this.a_Position, srcData: cube.position, size: 3 },
          { location: this.a_TexCoord, srcData: cube.texCoord, size: 2 },
        ],
        indices: {
          srcData: cube.indices,
        },
      });

      /**
       * Геометрия квадрата (для прохода 2)
       * uv: (0, 0) в левом-нижнем углу - GL-ориентация, совпадает с ориентацией framebuffer-текстуры
       * */
      const quadPosition = new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0]);
      const quadTexCoord = new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]);
      const quadIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
      const quadVAO = createVAO({
        gl,
        attributes: [
          { location: this.a_Position, srcData: quadPosition, size: 3 },
          {
            location: this.a_TexCoord,
            srcData: quadTexCoord,
            size: 2,
          },
        ],
        indices: { srcData: quadIndices },
      });

      // текстура sea (на куб) и offscreen-цель (в неё рисуем куб)
      const { texture: seaTexture } = createTexture({ gl, src: sea, slot: 0 });
      const fb = createFramebuffer({ gl, width: 512, height: 512, destroyRef });

      // фиксированная камера маленькой сцены внутри framebuffer (квадратная, aspect = 1)
      const innerProjection = mat4.perspective(mat4.create(), (Math.PI * 30) / 180, 1, 0.1, 100);
      const innerView = mat4.lookAt(mat4.create(), [0, 0, 6], [0, 0, 0], [0, 1, 0]);

      let animationId = 0;
      let startTime: number | null = null;

      const render = (now: number) => {
        if (startTime === null) startTime = now;
        const time = (now - startTime) / 1000;

        // синхронизируем буфер canvas (для прохода 2)
        const { width, height } = size();
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        // 1 ПРОХОД: вращающийся куб => в текстуру framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer); // переключение рисования на использование объекта буфера кадра
        gl.viewport(0, 0, fb.width, fb.height); // viewport под размер ТЕКСТУРЫ
        gl.clearColor(0.2, 0.2, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, seaTexture); // куб красим морем
        gl.bindVertexArray(cubeVAO.vao);
        const cubeModel = composeModel({
          scale: vec3.fromValues(0.75, 0.75, 0.75),
          rotate: {
            axis: vec3.fromValues(0, 1, 0),
            radian: time / 1.5,
          },
        });
        const cubeMVP = composeMatrix({
          projection: innerProjection,
          view: innerView,
          model: cubeModel,
        });
        gl.uniformMatrix4fv(u_Matrix, false, cubeMVP);
        gl.drawElements(gl.TRIANGLES, cube.count, gl.UNSIGNED_SHORT, 0);

        // 2 ПРОХОД: квадрат => на экран, текстура = результат прохода 1
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // переключение рисования на использование обратно буфера цвета
        gl.viewport(0, 0, canvas.width, canvas.height); // viewport под размер CANVAS
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, fb.colorTexture); // на квадрат - отдельный куб
        gl.bindVertexArray(quadVAO.vao);
        const aspect = canvas.width / canvas.height;
        const outerProjection = mat4.perspective(mat4.create(), (Math.PI * 30) / 180, aspect, 0.1, 100);
        const quadModel = composeModel({
          scale: vec3.fromValues(1.5, 1.5, 1.5),
        });
        const quadMVP = composeMatrix({
          projection: outerProjection,
          view: viewMatrix(),
          model: quadModel,
        });
        gl.uniformMatrix4fv(u_Matrix, false, quadMVP);
        gl.drawElements(gl.TRIANGLES, quadIndices.length, gl.UNSIGNED_SHORT, 0);

        animationId = requestAnimationFrame(render);
      };

      animationId = requestAnimationFrame(render);
      destroyRef.onDestroy(() => cancelAnimationFrame(animationId));
    });
  }
}
