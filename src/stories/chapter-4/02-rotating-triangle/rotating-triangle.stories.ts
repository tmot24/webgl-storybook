import type { Meta, StoryObj } from '@storybook/angular';
import { RotatingTriangle } from './rotating-triangle';

const meta: Meta<RotatingTriangle> = {
  title: 'WebGL/Глава 04/02 RotatingTriangle',
  component: RotatingTriangle,
  argTypes: {
    //   color: { control: 'color' },
    offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
  },
};

type Story = StoryObj<RotatingTriangle>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    offsetX: 0.7,
    offsetY: 0.7,
    speed: 0.2,
  },
};
export default meta;
