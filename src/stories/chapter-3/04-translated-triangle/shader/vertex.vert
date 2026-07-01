#version 300 es

layout(location = 0) in vec4 a_Position;

uniform vec4 u_Translation;

void main() {
  gl_Position = a_Position + u_Translation;
}
