import { DestroyRef, Signal } from '@angular/core';

export interface AttributeSpec {
  geometryKey: 'position' | 'color' | 'texCoord'; // какой атрибут геометрии берём
  location: number;
  size: number;
}
export interface Material {
  vertex: string;
  fragment: string;
  attributes: AttributeSpec[]; // что материал читает из геометрии
  // одноразовая настройка uniform/текстур этого материала (опционально)
  setupUniforms?: (params: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    destroyRef: DestroyRef;
  }) => void | { isReady?: Signal<boolean> };
}
