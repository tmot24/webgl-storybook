import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';

@Component({
  selector: 'app-multi-point',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class MultiPoint {
  // Ссылка на атрибут layout(location = 0) in vec4 a_Position;
  private readonly a_Position = 0;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  constructor() {
    injectWebGLRender({
      canvasRef: this.canvas,
      vertex: vertexSource,
      fragment: fragmentSource,
      setup: ({ gl, destroyRef }) => {
        const vertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
        const n = 3; // Число вершин
        const size = 2; // Число координат

        // 1. Создать буферный объект
        /**
         * Создаёт буферный объект
         * */
        const vertexBuffer = gl.createBuffer();
        // 2. Указать тип буферного объекта
        /**
         * Активирует буферный объект и указывает его тип:
         * Параметры:
         * target - может иметь одно из значений:
         *  а) gl.ARRAY_BUFFER - указывает, что буферный объект содержит информацию о вершинах
         *  б) ELEMENT_ARRAY_BUFFER - указывает, что буферный объект содержит значения индексов, ссылающихся
         *  на информацию о вершинах
         * buffer - ссылка на буферный объект, предварительно созданный вызовом gl.createBuffer()
         * */
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // 3. Записать данные в буферный объект
        /**
         * Выделяет память для буферного объекта и записывает данные srcData в буферный объект, тип которого
         * определяется параметром target
         * Параметры:
         * target - gl.ARRAY_BUFFER или ELEMENT_ARRAY_BUFFER
         * srcData - Данные для записи в буферный объект (типизированный массив)
         * usage - Подсказка о том, как программа собирается использовать данные в буферном объекте.
         * Эта подсказка помогает системе WebGL оптимизировать производительность, но не является страховкой от ошибок
         * в программе.
         *  а) gl.STATIC_DRAW - Данные в буферном объекте будут определены один раз и использованы многократно для рисования фигур.
         *  б) gl.STREAM_DRAW - Данные в буферном объекте будут определены один раз и использованы лишь несколько раз для
         *  рисования фигур.
         *  в) gl.DYNAMIC_DRAW - Данные в буферном объекте будут определены многократно и использованы для рисования фигур
         *  так же многократно
         * */
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // 4. Сохранить ссылку на буферный объект в переменной a_Position
        /**
         * Присваивает буферный объект тип gl.ARRAY_BUFFER переменной-атрибуту location
         * Параметры:
         * location - Определяет переменную-атрибут, которой будет выполнено присваивание.
         * size - Определяет число компонентов на вершину в буферном объекте (допустимыми являются значения от 1 до 4).
         * Если значения параметра size меньше числа элементов, требуемых переменной-атрибутом, отсутствующие компоненты
         * автоматически получат значения по умолчанию 0.0, а четвёртый 1.0,
         * как указывается в описании семейства методов gl.vertexAttrib[1234]f()
         * type - Определяет формат данных. Может иметь одно из значений:
         *  а) gl.UNSIGNED_BYTE - беззнаковый байт для Uint8Array
         *  б) gl.SHORT - короткое целое со знаком для Int16Array
         *  в) gl.UNSIGNED_SHORT - короткое целое без знака для Uint16Array
         *  г) gl.INT - целое со знаком для Int32Array
         *  д) gl.UNSIGNED_INT - целое без знака для Uint32Array
         *  е) gl.FLOAT - вещественное для Float32Array
         * normalized - Либо true, либо false. Указывает на необходимость нормализации невещественных данных
         * в диапазон [0, 1] или [-1, 1].
         * stride - Определяет число байтов между разными элементами данных. Значение по умолчанию 0.
         * offset - Определяет смещение (в байтах) от начала буферного объекта, где хранятся данные для вершин.
         * Если данные хранятся с самого начала буфера, в этом параметре следует передать значение 0.
         * */
        gl.vertexAttribPointer(this.a_Position, size, gl.FLOAT, false, 0, 0);
        // 5. Разрешить присваивание переменной a_Position
        /**
         * Разрешает присваивание буферного объекта переменной-атрибуту, определяемой параметром location.
         * Параметры:
         * location - Определяет переменную-атрибут.
         * */
        gl.enableVertexAttribArray(this.a_Position);

        destroyRef.onDestroy(() => {
          gl.deleteBuffer(vertexBuffer);
        });
        return { n };
      },
      render: ({ gl, setup: { n } }) => {
        /**
         * Выполняет вершинный шейдер, чтобы нарисовать фигуры, определяемые параметром mode.
         * Параметры:
         * mode - Определяет тип фигуры. Допустимыми значениями являются следующие константы:
         * gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, gl.TRIANGLES, gl.TRIANGLE_STRIP и gl.TRIANGLE_FAN.
         * first - Определяет номер вершины, с которой должно начинаться рисование (целое число).
         * count - Определяет количество вершин (целое число).
         * */
        gl.drawArrays(gl.POINTS, 0, n);
      },
    });
  }
}
