import type { Meta, StoryObj } from '@storybook/angular';
import { LookAtTriangles } from './look-at-triangles';

const meta: Meta<LookAtTriangles> = {
  title: 'WebGL/Глава 06/01 LookAtTriangles',
  component: LookAtTriangles,
  argTypes: {
    //   color: { control: 'color' },
    // offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    angleAxisZ: { control: { type: 'range', min: -180, max: 180, step: 10 } },
    near: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    far: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
};

type Story = StoryObj<LookAtTriangles>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    // offsetX: 0.7,
    // offsetY: 0.7,
    // speed: 0.2,
    angleAxisZ: 10,
    near: -1,
    far: 1,
  },
};
export default meta;
