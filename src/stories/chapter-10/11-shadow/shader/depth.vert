#version 300 es

layout(location = 0) in vec4 a_Position;

uniform mat4 u_LightSpaceMatrix;
uniform mat4 u_Model;

void main() {
  gl_Position = u_LightSpaceMatrix * u_Model * a_Position;
}
