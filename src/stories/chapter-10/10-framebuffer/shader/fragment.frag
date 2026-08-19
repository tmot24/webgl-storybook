#version 300 es
precision mediump float; // Спецификатор точности

in vec2 v_TexCoord;

uniform sampler2D u_Sampler;

out vec4 fragColor;

void main() {
  fragColor = texture(u_Sampler, v_TexCoord);
}
