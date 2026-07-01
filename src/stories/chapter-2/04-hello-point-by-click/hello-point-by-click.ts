import { Component, ElementRef, signal, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';

@Component({
  selector: 'app-hello-point-by-click',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  template: ` <canvas #canvasRef (click)="clickHandler($event)"></canvas>`,
})
export class HelloPointByClick {
  // Ссылка на атрибут layout(location = 0) in vec4 a_Position;
  private readonly a_Position = 0;
  private readonly a_PointSize = 1;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  private readonly points = signal<{ x: number; y: number; color: { r: number; g: number; b: number } }[]>([]);

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      // один раз: достаём адрес uniform из программы
      setup: ({ gl, program }) => {
        const u_FragColor = gl.getUniformLocation(program, 'u_FragColor');
        if (!u_FragColor) throw new Error('uniform u_FragColor не найден');
        return { u_FragColor };
      },
      render: ({ gl, setup: { u_FragColor } }) => {
        // Эффект перезапускается на изменение points() и size()
        // clear уже сделан в afterRenderEffect - здесь только рисуем ВСЕ точки заново
        for (const {
          x,
          y,
          color: { r, g, b },
        } of this.points()) {
          /**
           * Атрибуты свои на каждую вершину.
           * Присваивает данные (v0, v1, v2) переменной-атрибуту, определяемой аргументом location (ссылкой)
           * */
          gl.vertexAttrib3f(this.a_Position, x, y, 0.0);
          gl.vertexAttrib1f(this.a_PointSize, 100.0);
          /**
           * Uniform один на все вершины.
           * Присваивает данные (v0, v1, v2) переменной-uniform, определяемой аргументом location (ссылкой)
           * */
          gl.uniform4f(u_FragColor, r, g, b, 1.0);

          /**
           * Выполняет вершинный шейдер, чтобы нарисовать фигуры, определяемые параметром mode.
           * Параметры:
           * mode - Определяет тип фигуры. Допустимыми значениями являются следующие константы: gl.POINTS, gl.LINES,
           * gl.LINE_STRIP, gl.LINE_LOOP, gl.TRIANGLES, gl.TRIANGLE_STRIP и gl.TRIANGLE_FAN
           * first - Определяет номер вершины, с которой должно начаться рисование.
           * count - Определяет количество вершин.
           * */
          gl.drawArrays(gl.POINTS, 0, 1);
        }
      },
    });
  }

  protected clickHandler(event: MouseEvent) {
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    // CSS-пиксели => clip [-1, 1]
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    const color = {
      r: x,
      g: y,
      b: 1,
    };

    this.points.update((prevValue) => [...prevValue, { x, y, color }]);
  }
}
