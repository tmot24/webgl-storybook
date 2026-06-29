import { afterRenderEffect, Component, ElementRef, input, viewChild } from '@angular/core';
import { injectCanvasSize } from '../../../inject/inject-canvas-size';

@Component({
  selector: 'app-draw-rectangle',
  imports: [],
  templateUrl: '../../index.html',
  host: { class: 'canvas-container' }, // для :host
})
export class DrawRectangle {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  private readonly size = injectCanvasSize({ canvasRef: this.canvas });

  color = input.required<string>();
  offsetXY = input<number>(0);

  constructor() {
    // useEffect с зависимостями от цвета и смещения [color, offsetXY, size]
    afterRenderEffect({
      write: () => {
        const canvas = this.canvas().nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = this.size();
        // меняем буфер только при реальном изменении размера
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        // Необходимо очищать, чтобы пиксели не накладывались друг на друга
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.color(); // подписка на сигнал
        ctx.fillRect(this.offsetXY(), this.offsetXY(), 250, 250);
      },
    });
  }
}
