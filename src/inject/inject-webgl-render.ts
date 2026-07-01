import { afterNextRender, afterRenderEffect, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { injectCanvasSize } from './inject-canvas-size';
import { createProgram } from '../helper/create-program';

interface InjectWebglRender<TSetup> {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  vertex: string;
  fragment: string;
  // одноразовая настройка после создания программы (буферы, локации и т.п.)
  setup: (params: { gl: WebGL2RenderingContext; program: WebGLProgram; destroyRef: DestroyRef }) => TSetup;
  // кадр: реактивный (ресайз + любой сигнал, прочитанный внутри)
  render: (params: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    width: number;
    height: number;
    setup: TSetup;
  }) => void;
}

export function injectWebGLRender<TSetup = Record<string, never>>({
  canvasRef,
  vertex,
  fragment,
  setup,
  render,
}: InjectWebglRender<TSetup>) {
  const size = injectCanvasSize({ canvasRef });
  const destroyRef = inject(DestroyRef);

  let gl: WebGL2RenderingContext | null;
  let program: WebGLProgram | null;
  let setupResult: TSetup;

  // ОДИН РАЗ: контекст, программа, пользовательский setup, регистрация очистки
  afterNextRender({
    write: () => {
      gl = canvasRef().nativeElement.getContext('webgl2');
      if (!gl) throw new Error('WebGL2 не поддерживается');

      program = createProgram({ gl, vertex, fragment });
      gl.useProgram(program);

      // Устанавливает цвет в COLOR_BUFFER_BIT для очистки (заливки) области рисования.
      // То есть сперва указываем (один раз), а при очистке ссылаемся на этот цвет
      gl.clearColor(0, 0, 0, 0.5);

      setupResult = setup({ gl, program, destroyRef });

      destroyRef.onDestroy(() => gl?.deleteProgram(program));
    },
  });

  // РЕАКТИВНО: ресайз буфера + viewport + кадр
  afterRenderEffect({
    write: () => {
      const { width, height } = size(); // зависимость => перерисовка на ресайз
      if (!gl || !program) return; // setup ещё не отработал (защита)

      const canvas = canvasRef().nativeElement;
      // меняем буфер только при реальном изменении размера
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      // viewport почти всегда должен совпадать с буфером
      gl.viewport(0, 0, width, height);
      // Очистить canvas. Без этой операции каждый последующий кадр будет отображать остатки предыдущего кадра,
      // что может привести к визуальным артефактам и ошибкам рендеринга.
      gl.clear(gl.COLOR_BUFFER_BIT);
      render({ gl, program, width, height, setup: setupResult });
    },
  });
}
