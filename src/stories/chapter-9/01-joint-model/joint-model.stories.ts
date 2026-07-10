import type { Meta, StoryObj } from '@storybook/angular';
import { JointModel } from './joint-model';

const meta: Meta<JointModel> = {
  title: 'WebGL/Глава 09/01 JointModel',
  component: JointModel,
  argTypes: {
    // color: { control: 'color' },
    arm1Angle: { control: { type: 'range', min: 0, max: 360, step: 10 } },
    joint1Angle: { control: { type: 'range', min: 0, max: 360, step: 10 } },
    // speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // near: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    // far: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  },
};

type Story = StoryObj<JointModel>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    arm1Angle: 30,
    joint1Angle: 50,
    // speed: 0.2,
    // near: 1,
    // far: 10,
  },
};
export default meta;
