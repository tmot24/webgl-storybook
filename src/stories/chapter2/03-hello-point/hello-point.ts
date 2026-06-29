import { afterRenderEffect, Component, ElementRef, Signal, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectCanvasSize } from '../../../inject/inject-canvas-size';

@Component({
  selector: 'app-hello-point',
  imports: [],
  templateUrl: '../../index.html',
  host: { class: 'canvas-container' }, // для :host
})
export class HelloPoint {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      render: (gl) => {
        // 1. Создание объекта шейдеров
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
          throw new Error('Ошибка при создании шейдеров');
        }

        // 2. Привязать шейдеры
        gl.shaderSource(vertexShader, vertexSource);
        gl.shaderSource(fragmentShader, fragmentSource);
        // 3. Компиляция шейдеров
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

        const vertexShaderCompiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        const fragmentShaderCompiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);

        if (!vertexShaderCompiled) {
          const error = gl.getShaderInfoLog(vertexShader);
          console.error(`Ошибка компиляции вершинного шейдера: ${error}`);
          gl.deleteShader(vertexShader);

          return;
        }
        if (!fragmentShaderCompiled) {
          const error = gl.getShaderInfoLog(fragmentShader);
          console.error('Ошибка компиляции фрагментного шейдера: ' + error);
          gl.deleteShader(fragmentShader);

          return;
        }

        // 4. Создание объекта программы
        const program = gl.createProgram();
        if (!program) return;

        // 5. Подключение шейдеров к программе
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // 6. Компонует объект программы
        gl.linkProgram(program);

        const programCompiled = gl.getProgramParameter(program, gl.LINK_STATUS);

        if (!programCompiled) {
          const error = gl.getProgramInfoLog(program);
          console.error(`Ошибка компоновки программы: ${error}`);
          gl.deleteProgram(program);

          return;
        }

        // 7. Сообщает что объект программы готов к использованию
        gl.useProgram(program);

        // Устанавливает цвет в COLOR_BUFFER_BIT для очистки (заливки) области рисования.
        // То есть сперва указываем (один раз), а при очистке ссылаемся на этот цвет
        gl.clearColor(0, 0, 0, 0.5);
        // Очистить canvas. Без этой операции каждый последующий кадр будет отображать остатки предыдущего кадра,
        // что может привести к визуальным артефактам и ошибкам рендеринга.
        gl.clear(gl.COLOR_BUFFER_BIT);

        /**
         Выполняет вершинный шейдер, чтобы нарисовать фигуры, определяемые параметром mode.
         Параметры:
         mode - Определяет тип фигуры. Допустимыми значениями являются следующие константы: gl.POINTS, gl.LINES,
         gl.LINE_STRIP, gl.LINE_LOOP, gl.TRIANGLES, gl.TRIANGLE_STRIP и gl.TRIANGLE_FAN
         first - Определяет номер вершины, с которой должно начаться рисование.
         count - Определяет количество вершин.
        **/
        gl.drawArrays(gl.POINTS, 0, 1);
      },
    });
  }
}

interface InjectWebglRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  render: (gl: WebGL2RenderingContext) => void;
}

function injectWebGLRender({ canvasRef, render }: InjectWebglRender) {
  const size = injectCanvasSize({ canvasRef });

  // useEffect с зависимостями от цвета и смещения [size]
  afterRenderEffect({
    write: () => {
      const canvas = canvasRef().nativeElement;
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        throw new Error('WebGL2 не поддерживается');
      }

      const { width, height } = size();
      // меняем буфер только при реальном изменении размера
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      // viewport почти всегда должен совпадать с буфером
      gl.viewport(0, 0, width, height);

      render(gl);
    },
  });
}
