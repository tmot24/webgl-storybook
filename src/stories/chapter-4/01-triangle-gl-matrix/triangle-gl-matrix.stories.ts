import type { Meta, StoryObj } from '@storybook/angular';
import { TriangleGlMatrix } from './triangle-gl-matrix';

const meta: Meta<TriangleGlMatrix> = {
  title: 'WebGL/Глава 04/01 TriangleGlMatrix',
  component: TriangleGlMatrix,
  argTypes: {
    //   color: { control: 'color' },
    offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    angleAxisZ: { control: { type: 'range', min: -180, max: 180, step: 10 } },
  },
};

type Story = StoryObj<TriangleGlMatrix>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    offsetX: 0.7,
    offsetY: 0.7,
    angleAxisZ: 150,
  },
};
export default meta;
