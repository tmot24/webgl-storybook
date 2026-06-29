#version 300 es
// Спецификатор точности
precision mediump float;

uniform vec4 u_FragColor;

out vec4 fragColor;

void main() {
    fragColor = u_FragColor;
}
