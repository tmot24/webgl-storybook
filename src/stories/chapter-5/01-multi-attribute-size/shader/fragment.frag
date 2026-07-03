#version 300 es
// Спецификатор точности
precision mediump float;

// varying-переменная интерполируется через этап растеризации
in vec4 v_Color;

out vec4 fragColor;

void main() {
    fragColor = v_Color;
}
