import { afterRenderEffect, Component, ElementRef, viewChild } from '@angular/core';
import { injectCanvasSize } from '../../../shared/inject-canvas-size';

@Component({
  selector: 'app-hello-canvas',
  imports: [],
  templateUrl: '../../index.html',
})
export class HelloCanvas {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  private readonly size = injectCanvasSize({ canvasRef: this.canvas });

  constructor() {
    // useEffect с зависимостями от цвета и смещения [size]
    afterRenderEffect({
      write: () => {
        const canvas = this.canvas().nativeElement;
        const gl = canvas.getContext('webgl2');
        if (!gl) {
          throw new Error('Ошибка при создании контекста');
        }

        const { width, height } = this.size();
        // меняем буфер только при реальном изменении размера
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        // Устанавливает цвет для очистки (заливки) области рисования.
        // То есть сперва указываем (один раз), а при очистке ссылаемся на этот цвет
        gl.clearColor(0, 0, 0, 0.5);
        // Очистить canvas. Без этой операции каждый последующий кадр будет отображать остатки предыдущего кадра,
        // что может привести к визуальным артефактам и ошибкам рендеринга.
        gl.clear(gl.COLOR_BUFFER_BIT);
      },
    });
  }
}
