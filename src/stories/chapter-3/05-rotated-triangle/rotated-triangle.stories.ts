import type { Meta, StoryObj } from '@storybook/angular';
import { RotatedTriangle } from './rotated-triangle';

const meta: Meta<RotatedTriangle> = {
  title: 'WebGL/Глава 03/05 RotatedTriangle',
  component: RotatedTriangle,
  argTypes: {
    //   color: { control: 'color' },
    angleAxisZ: { control: { type: 'range', min: -180, max: 180, step: 10 } },
  },
};

type Story = StoryObj<RotatedTriangle>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    angleAxisZ: 90,
  },
};
export default meta;
