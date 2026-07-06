import { afterNextRender, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';
import { vec3 } from 'gl-matrix';

interface InjectOrbitCamera {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  initialEye: vec3;
  // Ограничение по азимуту: не даём cos(azimuth) стать <= 0, иначе z уйдёт в 0/минус
  maxAzimuth?: number;
  // Ограничение по полярному углу — просто эстетическое, чтобы камера не проходила через полюс (0° / 180°),
  // где x и z вырождаются в 0 и картинка "плющится"
  minPolar?: number;
  maxPolar?: number;
}

export function injectOrbitCamera({
  canvasRef,
  initialEye,
  maxAzimuth = Math.PI / 2 - 0.15, // ~75°, запас 0.15 рад от критических ±90°
  minPolar = Math.PI / 6, // 30°
  maxPolar = Math.PI - Math.PI / 6, // 150°
}: InjectOrbitCamera): {
  eyePoint: Signal<vec3>;
} {
  const destroyRef = inject(DestroyRef);
  const eyePoint = signal(initialEye);
  // Радиус орбиты — считаем один раз от исходного eyePoint, дальше не меняем (зума пока нет)
  const radius = vec3.length(initialEye);

  const mouseMoveHandler = (event: MouseEvent) => {
    // Битовая маска
    const isRightButton = (event.buttons & 2) === 2;
    if (!isRightButton) return; // вращаем только при зажатой ПКМ

    const rect = canvasRef().nativeElement.getBoundingClientRect();

    // Нормализуем позицию мыши в канвасе в диапазон [-1, 1]
    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    // Азимут вокруг оси Y, ограничен так, чтобы z всегда оставался положительным.
    // Инвертируем X: движение мыши вправо -> камера уходит влево (привычнее для orbit-контролов)
    const azimuth = -ndcX * maxAzimuth;

    // Полярный угол от оси Y (0 — сверху, π — снизу), ограничен, чтобы не проходить через полюса
    // ndcY инвертируем: тянем мышь вверх (ndcY < 0) — камера поднимается (polar уменьшается)
    const polarRange = maxPolar - minPolar;
    const polar = minPolar + ((-ndcY + 1) / 2) * polarRange;

    const x = radius * Math.sin(polar) * Math.sin(azimuth);
    const y = radius * Math.cos(polar);
    const z = radius * Math.sin(polar) * Math.cos(azimuth);

    eyePoint.set(vec3.fromValues(x, y, z));
  };

  const contextMenuHandler = (event: MouseEvent) => {
    event.preventDefault(); // не даём открыться системному меню при ПКМ
  };

  // Слушатели вешаем только после того, как view гарантированно инициализирован
  // и canvasRef() можно безопасно резолвить
  afterNextRender({
    write: () => {
      const canvasElement = canvasRef().nativeElement;
      canvasElement.addEventListener('mousemove', mouseMoveHandler);
      canvasElement.addEventListener('contextmenu', contextMenuHandler);

      destroyRef.onDestroy(() => {
        canvasElement.removeEventListener('mousemove', mouseMoveHandler);
        canvasElement.removeEventListener('contextmenu', contextMenuHandler);
      });
    },
  });

  return {
    eyePoint,
  };
}
