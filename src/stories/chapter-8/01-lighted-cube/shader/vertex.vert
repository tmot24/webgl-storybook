#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in vec4 a_Normal;
layout(location = 2) in vec4 a_Color;

uniform mat4 u_Matrix;
uniform vec3 u_LightColor;
uniform vec3 u_LightDirection;

out vec4 v_Color;


void main() {
  gl_Position = u_Matrix * a_Position;

  // Нормализовать длину вектора нормали
  vec3 normal = normalize(vec3(a_Normal));
  // Скалярное произведение направления (функция dot) света на ориентацию поверхности
  float nDotl = max(dot(u_LightDirection, normal), 0.0);
  // Вычислить цвет в модели диффузного отражения
  vec3 diffuse = u_LightColor * vec3(1.0) * nDotl;
  v_Color = vec4(diffuse, a_Color.a);
}
