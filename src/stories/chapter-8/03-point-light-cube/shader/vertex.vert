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

out vec4 v_Color;


void main() {
  vec4 worldPosition = u_ModelMatrix * a_Position;
  gl_Position = u_Matrix * worldPosition;

  // Нормализовать длину вектора нормали
  vec3 normal = normalize(u_NormalMatrix * vec3(a_Normal));
  // Найти направление на источник света и нормализовать его
  vec3 lightDirection = normalize(u_LightPosition - vec3(worldPosition));
  // Скалярное произведение направления (функция dot) света на ориентацию поверхности
  float nDotl = max(dot(lightDirection, normal), 0.0);
  // Вычислить цвет в модели диффузного отражения
  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotl;
  // Вычислить цвет в модели фонового отражения
  vec3 ambient = u_Ambient * vec3(a_Color);
  // Сложить цвет в модели диффузного и фонового отражения
  v_Color = vec4(diffuse + ambient, a_Color.a);
}
