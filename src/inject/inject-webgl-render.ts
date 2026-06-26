import { afterRenderEffect, ElementRef, Signal } from '@angular/core';
import { injectCanvasSize } from './inject-canvas-size';

export interface MyWebGLRenderContext {
  gl: WebGL2RenderingContext;
}

interface InjectWebglRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  render: (context: MyWebGLRenderContext) => void;
}

export function injectWebGLRender({ canvasRef, render }: InjectWebglRender) {
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

      render({ gl });
    },
  });
}
