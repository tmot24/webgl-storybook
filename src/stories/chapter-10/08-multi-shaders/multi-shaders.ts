import { Component, ElementRef, viewChild } from '@angular/core';
import colorVertexSource from './shader/color-vertex.vert';
import colorFragmentSource from './shader/color-fragment.frag';
import textureVertexSource from './shader/texture-vertex.vert';
import textureFragmentSource from './shader/texture-fragment.frag';
import { mat4, vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { cubeGeometry } from '../../../helper/geometry/cube-geometry';
import { Material } from '../../../helper/material/material';
import { createTexture } from '../../../helper/mesh/create-texture';
import sea from '../../../image/sea.jpeg';
import { injectMultiMaterialRender } from '../../../inject/inject-multi-material-render';

@Component({
  selector: 'app-multi-shaders',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class MultiShaders {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Color = 2;
  private readonly a_TexCoord = 2;

  private readonly textureSlot = 0;

  constructor() {
    const { viewMatrix } = injectOrbitCamera({ canvasRef: this.canvas, initialEye: vec3.fromValues(3, 3, 10) });
    const geometry = cubeGeometry();

    const colorMaterial: Material = {
      vertex: colorVertexSource,
      fragment: colorFragmentSource,
      attributes: [
        { geometryKey: 'position', location: this.a_Position, size: 3 },
        { geometryKey: 'color', location: this.a_Color, size: 3 },
      ],
    };

    const textureMaterial: Material = {
      vertex: textureVertexSource,
      fragment: textureFragmentSource,
      attributes: [
        { geometryKey: 'position', location: this.a_Position, size: 3 },
        { geometryKey: 'texCoord', location: this.a_TexCoord, size: 2 },
      ],
      setupUniforms: ({ gl, program, destroyRef }) => {
        const { texture, slot, isReadyTexture } = createTexture({ gl, src: sea, slot: this.textureSlot });
        const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        if (!u_Sampler) throw new Error('uniform u_Sampler не найден');

        gl.uniform1i(u_Sampler, slot);
        destroyRef.onDestroy(() => gl.deleteTexture(texture));

        return { isReady: isReadyTexture };
      },
    };

    // viewProjection пересобираем как функцию (читает камеру и размер)
    const viewProjection = () => {
      const canvas = this.canvas().nativeElement;
      const aspect = canvas.width / canvas.height;
      const projection = mat4.perspective(mat4.create(), (Math.PI * 30) / 180, aspect, 1, 100);
      return mat4.multiply(mat4.create(), projection, viewMatrix());
    };

    injectMultiMaterialRender({
      canvasRef: this.canvas,
      geometry,
      viewProjection,
      objects: [
        {
          material: colorMaterial,
          modelMatrix: () => mat4.fromTranslation(mat4.create(), vec3.fromValues(-2.5, 0, 0)),
        },
        {
          material: textureMaterial,
          modelMatrix: () => mat4.fromTranslation(mat4.create(), vec3.fromValues(2.5, 0, 0)),
        },
      ],
    });
  }
}
