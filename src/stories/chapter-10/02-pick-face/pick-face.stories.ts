import type { Meta, StoryObj } from '@storybook/angular';
import { PickFace } from './pick-face';

const meta: Meta<PickFace> = {
  title: 'WebGL/Глава 10/02 PickFace',
  component: PickFace,
  argTypes: {
    // color: { control: 'color' },
    // offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // near: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    // far: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  },
};

type Story = StoryObj<PickFace>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    // offsetX: 0.7,
    // offsetY: 0.7,
    // speed: 0.2,
    // near: 1,
    // far: 10,
  },
};
export default meta;
