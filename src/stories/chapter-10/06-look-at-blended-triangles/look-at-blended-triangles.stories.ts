import type { Meta, StoryObj } from '@storybook/angular';
import { LookAtBlendedTriangles } from './look-at-blended-triangles';

const meta: Meta<LookAtBlendedTriangles> = {
  title: 'WebGL/Глава 10/06 LookAtBlendedTriangles',
  component: LookAtBlendedTriangles,
  argTypes: {
    //   color: { control: 'color' },
    // offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    angleAxisZ: { control: { type: 'range', min: -180, max: 180, step: 10 } },
    near: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    far: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
  },
};

type Story = StoryObj<LookAtBlendedTriangles>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    // offsetX: 0.7,
    // offsetY: 0.7,
    // speed: 0.2,
    angleAxisZ: 10,
    near: -1,
    far: 1.3,
  },
};
export default meta;
