import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { injectWebGLRender } from '../../../inject/inject-webgl-render';

@Component({
  selector: 'app-hello-triangle',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class HelloTriangle {
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

        /**
         * VAO - контейнер конфигурации атрибутов (Vertex Array Object).
         * Это контейнер, который запоминает конфигурацию атрибутов,
         * какой буфер к какому атрибуту, размеры, типы, что включено.
         * */
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao); // с этого момента настройки атрибутов пишутся в vao
        // 1. Создать буферный объект
        const vertexBuffer = gl.createBuffer();
        // 2. Указать тип буферного объекта
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // 3. Записать данные в буферный объект
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // 4. Сохранить ссылку на буферный объект в переменной a_Position
        gl.vertexAttribPointer(this.a_Position, size, gl.FLOAT, false, 0, 0);
        // 5. Разрешить присваивание переменной a_Position
        gl.enableVertexAttribArray(this.a_Position);
        // Отвязываем, чтобы случайные последующие вызовы не писались в наш vao
        gl.bindVertexArray(null);

        destroyRef.onDestroy(() => {
          gl.deleteBuffer(vertexBuffer);
          gl.deleteVertexArray(vao); // VAO - тоже GPU-ресурс - удаляем
        });
        return { n, vao };
      },
      render: ({ gl, setup: { n, vao } }) => {
        gl.bindVertexArray(vao); // Одна строка вместо перепривязки буфера и атрибутов
        gl.drawArrays(gl.TRIANGLES, 0, n);
      },
    });
  }
}
