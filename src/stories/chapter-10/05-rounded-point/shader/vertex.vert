#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in float a_PointSize;

void main() {
  gl_Position = a_Position;
  gl_PointSize = a_PointSize;
}
