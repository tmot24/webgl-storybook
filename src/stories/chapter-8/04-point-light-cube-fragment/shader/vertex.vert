#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in vec4 a_Normal;
layout(location = 2) in vec4 a_Color;

uniform mat4 u_Matrix; // projection * view - как и было
uniform mat4 u_ModelMatrix;
uniform mat3 u_NormalMatrix; // для корректного преобразования нормалей

uniform vec3 u_Ambient; // Цвет фонового света
uniform vec3 u_LightColor;
uniform vec3 u_LightPosition;

out vec3 v_Position;
out vec3 v_Normal;
out vec4 v_Color;


void main() {
  vec4 worldPosition = u_ModelMatrix * a_Position;
  gl_Position = u_Matrix * worldPosition;
  v_Position = vec3(worldPosition);
  v_Normal = normalize(vec3(u_NormalMatrix * vec3(a_Normal)));
  v_Color = a_Color;
}
