#version 300 es
// Спецификатор точности
precision mediump float;

in vec2 v_TexCoord; // varying-переменная интерполируется через этап растеризации

uniform sampler2D u_Sampler;

out vec4 fragColor;

void main() {
    fragColor = texture(u_Sampler, v_TexCoord);
}
