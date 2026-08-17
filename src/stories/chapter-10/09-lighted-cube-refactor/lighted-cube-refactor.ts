import { Component, ElementRef, viewChild } from '@angular/core';
import vertexSource from './shader/vertex.vert';
import fragmentSource from './shader/fragment.frag';
import { vec3 } from 'gl-matrix';
import { injectOrbitCamera } from '../../../inject/inject-orbit-camera';
import { constructCubeGeometry } from '../../../helper/geometry/construct-cube-geometry';
import { Material } from '../../../helper/material/material';
import { injectMultiMaterialRender } from '../../../inject/inject-multi-material-render';
import { createViewProjectionMatrix } from '../../../helper/matrix/create-view-projection-matrix';

@Component({
  selector: 'app-lighted-cube-refactor',
  imports: [],
  host: { class: 'canvas-container' }, // для :host
  templateUrl: '../../index.html',
})
export class LightedCubeRefactor {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private readonly a_Position = 0;
  private readonly a_Normal = 1;
  private readonly a_Color = 2;

  constructor() {
    const { viewMatrix } = injectOrbitCamera({
      canvasRef: this.canvas,
      initialEye: vec3.fromValues(3, 3, 7),
    });

    const viewProjection = createViewProjectionMatrix({ canvasRef: this.canvas, viewMatrix });

    const cubeGeometry = constructCubeGeometry();
    const material: Material = {
      vertex: vertexSource,
      fragment: fragmentSource,
      attributes: [
        {
          geometryKey: 'position',
          location: this.a_Position,
          size: 3,
        },
        {
          geometryKey: 'normal',
          location: this.a_Normal,
          size: 3,
        },
        {
          geometryKey: 'color',
          location: this.a_Color,
          size: 2,
        },
      ],
      setup: ({ gl, program }) => {
        const u_Ambient = gl.getUniformLocation(program, 'u_Ambient');
        if (!u_Ambient) throw new Error('uniform u_Ambient не найден');
        const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
        if (!u_LightColor) throw new Error('uniform u_LightColor не найден');
        const u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');
        if (!u_LightDirection) throw new Error('uniform u_LightDirection не найден');

        const lightDirection = vec3.fromValues(0.5, 3.0, 1.0);
        vec3.normalize(lightDirection, lightDirection);

        gl.uniform3fv(u_LightDirection, lightDirection);
        // Цвет фонового света
        gl.uniform3f(u_Ambient, 0.2, 0.2, 0.2);
        // Цвет от источника света
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
      },
    };

    injectMultiMaterialRender({
      canvasRef: this.canvas,
      geometry: cubeGeometry,
      viewProjection,
      objects: [
        {
          material,
        },
      ],
    });
  }
}
