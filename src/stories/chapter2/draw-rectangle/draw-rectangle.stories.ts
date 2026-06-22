import type { Meta, StoryObj } from '@storybook/angular';
import { DrawRectangle } from './draw-rectangle';

const meta: Meta<DrawRectangle> = {
  title: 'WebGL/Глава 2/1 DrawRectangle',
  component: DrawRectangle,
  // parameters: { layout: 'fullscreen' },
  argTypes: {
    color: { control: 'color' },
    offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  },
};

type Story = StoryObj<DrawRectangle>;
export const Main: Story = {
  args: {
    color: '#ff0000',
    offsetXY: 0,
  },
};
export default meta;
