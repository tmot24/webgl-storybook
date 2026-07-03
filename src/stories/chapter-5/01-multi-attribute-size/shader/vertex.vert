#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in float a_PointSize;
layout(location = 2) in vec4 a_Color;

// varying-переменная интерполируется через этап растеризации
out vec4 v_Color;

void main() {
  gl_Position = a_Position;
  gl_PointSize = a_PointSize;
  v_Color = a_Color; // обязательно перекладываем атрибут в varying, чтобы он «поехал» дальше
}
