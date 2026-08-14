#version 300 es
// Спецификатор точности
precision mediump float;

uniform vec4 u_FragColor;

out vec4 fragColor;

void main() {
  // Центр координат находится в точке (0.5, 0.5)
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
  // Плавный переход на кромке вместо резкого обрыва:
  // alpha = 1 внутри, 0 снаружи, мягкий спад в узкой полоске у 0.5
  float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
  if (alpha < 0.01) discard; // совсем непрозрачное - отбрасываем
  // fragColor = u_FragColor;
  fragColor = vec4(u_FragColor.rgb, u_FragColor.a * alpha);
}
