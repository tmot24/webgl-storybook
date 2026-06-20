import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-draw-rectangle',
  imports: [],
  templateUrl: '../../index.html',
  host: { class: 'webgl-lesson' }, // для :host
})
export class DrawRectangle {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  private readonly destroyRef = inject(DestroyRef);

  color = input.required<string>();
  offsetXY = input<number>(0);

  // Размер буфера рисования (стандартный 300 на 150) в device-пикселях
  private readonly size = signal({ width: 300, height: 150 });

  constructor() {
    // Один раз. useEffect с пустыми зависимостями []
    afterNextRender({
      // earlyRead идёт ДО write — меряем размер до первой отрисовки
      earlyRead: () => {
        const el = this.canvas().nativeElement;
        this.measure(el); // ставим size синхронно, до первого draw

        const ro = new ResizeObserver(() => this.measure(el));
        ro.observe(el);
        this.destroyRef.onDestroy(() => ro.disconnect());
      },
    });

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

  private measure(el: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    this.size.set({
      width: Math.max(1, Math.round(el.clientWidth * dpr)),
      height: Math.max(1, Math.round(el.clientHeight * dpr)),
    });
  }
}
