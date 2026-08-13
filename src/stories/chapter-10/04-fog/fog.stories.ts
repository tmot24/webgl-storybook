import type { Meta, StoryObj } from '@storybook/angular';
import { Fog } from './fog';

const meta: Meta<Fog> = {
  title: 'WebGL/Глава 10/04 Fog',
  component: Fog,
  argTypes: {
    // color: { control: 'color' },
    // offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    near: { control: { type: 'range', min: 0, max: 7, step: 1 } },
    far: { control: { type: 'range', min: 8, max: 20, step: 1 } },
  },
};

type Story = StoryObj<Fog>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    // offsetX: 0.7,
    // offsetY: 0.7,
    // speed: 0.2,
    near: 2,
    far: 10,
  },
};
export default meta;
