#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in vec2 a_TexCoord;

out vec2 v_TexCoord; // varying-переменная интерполируется через этап растеризации

void main() {
  gl_Position = a_Position;
  v_TexCoord = a_TexCoord; // обязательно перекладываем атрибут в varying, чтобы он «поехал» дальше
}
