#version 300 es
// Спецификатор точности
precision mediump float;

in vec4 v_Color;
uniform bool u_Highlight;

out vec4 fragColor;

void main() {
  if (u_Highlight) {
    fragColor = vec4(v_Color.rgb * vec3(1.0, 0.0, 0.0), v_Color.a);
  } else {
    fragColor = v_Color;
  }
}
