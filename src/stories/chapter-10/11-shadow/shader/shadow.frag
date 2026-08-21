#version 300 es
precision mediump float;

in vec3 v_Normal;
in vec4 v_PosLightSpace;

uniform sampler2D u_ShadowMap;
uniform vec3 u_LightDir;
uniform vec3 u_Color;

out vec4 fragColor;

float isShadow(vec4 posLightSpace, float nDotL) {
  // перспективное деление + перевод из [-1, 1] в [0, 1] (координаты текстуры)
  vec3 proj = posLightSpace.xyz / posLightSpace.w;
  proj = proj * 0.5 + 0.5;

  // за пределами карты света => считаем освещённым (не в тени)
  if (proj.z > 1.0 || proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0) {
    return 0.0;
  }

  float closestDepth = texture(u_ShadowMap, proj.xy).r; // ближайшая глубина от света
  float currentDepth = proj.z; // глубина этого фрагмента

  // BIAS против shadow acne: наклонённые к свету поверхности нуждаются в большем смещении
  float bias = max(0.005 * (1.0 - nDotL), 0.001);

  // если текущий ДАЛЬШЕ записанного (с учётом bias) => между ним и светом преграда => тень
  return currentDepth - bias > closestDepth ? 1.0 : 0.0;
}

void main() {
  vec3 normal = normalize(v_Normal);
  float nDotL = max(dot(normal, normalize(u_LightDir)), 0.0);

  float shadow = isShadow(v_PosLightSpace, nDotL);
  // тень гасит диффуз, но не ambient (в тени не абсолютно черно)
  float lighting = 0.3 + (1.0 - shadow) * nDotL * 0.7;

  fragColor = vec4(u_Color * lighting, 1.0);
}
