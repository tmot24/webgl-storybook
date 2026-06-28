import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';

@Component({
  selector: 'app-hello-point-by-click',
  imports: [],
  templateUrl: '../../index.html',
})
export class HelloPointByClick {
  // Ссылка на атрибут layout(location = 0) in vec4 a_Position;
  private readonly a_Position = 0;
  private readonly a_PointSize = 1;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      render: ({ gl }) => {
        /**
         * Атрибуты свои на каждую вершину.
         * Присваивает данные (v0, v1, v2) переменной-атрибуту, определяемой аргументом location (ссылкой)
         * */
        gl.vertexAttrib3f(this.a_Position, 0.5, 0.5, 0.0);
        gl.vertexAttrib1f(this.a_PointSize, 100.0);

        /**
         * Выполняет вершинный шейдер, чтобы нарисовать фигуры, определяемые параметром mode.
         * Параметры:
         * mode - Определяет тип фигуры. Допустимыми значениями являются следующие константы: gl.POINTS, gl.LINES,
         * gl.LINE_STRIP, gl.LINE_LOOP, gl.TRIANGLES, gl.TRIANGLE_STRIP и gl.TRIANGLE_FAN
         * first - Определяет номер вершины, с которой должно начаться рисование.
         * count - Определяет количество вершин.
         * */
        gl.drawArrays(gl.POINTS, 0, 1);
      },
    });
  }
}
