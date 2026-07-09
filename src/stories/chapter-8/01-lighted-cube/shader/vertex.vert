#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in vec4 a_Normal;
layout(location = 2) in vec4 a_Color;

uniform mat4 u_Matrix;
uniform vec3 u_Ambient; // Цвет фонового света
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
  vec3 diffuse = u_LightColor * vec3(1.0) * nDotl; // vec3(a_Color) заменил на vec3(1.0) для наглядности
  // Вычислить цвет в модели фонового отражения
  vec3 ambient = u_Ambient * vec3(1.0); // // vec3(a_Color) заменил на vec3(1.0) для наглядности
  // Сложить цвет в модели диффузного и фонового отражения
  v_Color = vec4(diffuse + ambient, a_Color.a);
}
