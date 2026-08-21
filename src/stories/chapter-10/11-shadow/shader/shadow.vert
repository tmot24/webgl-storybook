#version 300 es

layout(location = 0) in vec4 a_Position;
layout(location = 1) in vec3 a_Normal;

uniform mat4 u_Matrix; // обычная камера: projection * view * model
uniform mat4 u_Model;
uniform mat4 u_LightSpaceMatrix; // для позиции в пространстве света

out vec3 v_Normal;
out vec4 v_PosLightSpace; // позиция фрагмента глазами света

void main() {
  gl_Position = u_Matrix * a_Position;
  v_Normal = mat3(u_Model) * a_Normal;
  v_PosLightSpace = u_LightSpaceMatrix * u_Model * a_Position;
}
