#version 300 es
// Спецификатор точности
precision mediump float;

in vec2 v_TexCoord; // varying-переменная интерполируется через этап растеризации

uniform sampler2D u_SamplerSea;
uniform sampler2D u_SamplerCircle;

out vec4 fragColor;

void main() {
  vec4 sea = texture(u_SamplerSea, v_TexCoord);
  vec4 circle = texture(u_SamplerCircle, v_TexCoord);

  // mix(задний, передний, сколько_переднего): при circle.a=0 → море, при 1 → круг
  vec3 color = mix(sea.rgb, circle.rgb, circle.a);
  fragColor = vec4(color, 1.0);
  // fragColor = sea + circle;
}
