#version 300 es
// Спецификатор точности
precision mediump float;

uniform vec3 u_Ambient; // Цвет фонового света
uniform vec3 u_LightColor;
uniform vec3 u_LightPosition;

in vec3 v_Position; // 1) знать местоположение фразмента в мировых координатах
in vec3 v_Normal; // 2) направление нормали в позиции фрагмента
in vec4 v_Color;

out vec4 fragColor;

void main() {
  // Нормализовать нормаль, которая интерполируется и не равно 1.0 (длина)
  vec3 normal = normalize(v_Normal);
  // Вычислить направление на источник света и нормализвать
  vec3 lightDirection = normalize(u_LightPosition - v_Position);
  // Скалярное произведение направления света и нормали
  float nDotL = max(dot(lightDirection, normal), 0.0);
  // Вычислить окончательный цвет с применением моделей диффузного и фонового отражения
  vec3 diffuse = u_LightColor * vec3(v_Color) * nDotL;
  vec3 ambient = u_Ambient * vec3(v_Color);
  fragColor = vec4(diffuse + ambient, v_Color.a);
}
