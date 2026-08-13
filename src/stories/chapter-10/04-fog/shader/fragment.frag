#version 300 es
precision mediump float; // Спецификатор точности

uniform vec3 u_FogColor; // Цвет тумана
uniform vec2 u_FogDist; // Начальная точка тумана, конечная точка

in vec4 v_Color;
in float v_Dist;

out vec4 fragColor;

void main() {
  // Коэффициент затуманивания
  // clamp(value, min, max) - ограничивает значение в диапазоне [min, max]
  float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
  vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);

  fragColor = vec4(color, v_Color.a);
}
