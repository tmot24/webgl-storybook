#version 300 es

layout(location = 0) in vec4 a_Position;
// Оптимальнее передавать вектор, а не каждое число отдельно
uniform vec2 u_CosBSinB;

// Тригонометрия
// x' = x cos b - y sin b
// y' = x sin b + y cos b
// z' = z

void main() {
  float cosB = u_CosBSinB.x;
  float sinB = u_CosBSinB.y;

  gl_Position.x = a_Position.x * cosB - a_Position.y * sinB;
  gl_Position.y = a_Position.x * sinB + a_Position.y * cosB;
  gl_Position.z = a_Position.z;
  gl_Position.w = a_Position.w;
}
