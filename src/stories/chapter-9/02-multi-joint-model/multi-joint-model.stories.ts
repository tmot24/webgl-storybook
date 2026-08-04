import type { Meta, StoryObj } from '@storybook/angular';
import { MultiJointModel } from './multi-joint-model';

const meta: Meta<MultiJointModel> = {
  title: 'WebGL/Глава 09/02 MultiJointModel',
  component: MultiJointModel,
  argTypes: {
    // color: { control: 'color' },
    upperArmAngle: { control: { type: 'range', min: 0, max: 360, step: 10 } },
    forearmAngle: { control: { type: 'range', min: -180, max: 180, step: 10 } },
    handAngle: { control: { type: 'range', min: 0, max: 360, step: 10 } },
    fingerAngle: { control: { type: 'range', min: -90, max: 90, step: 10 } },
    // speed: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    // near: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    // far: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  },
};

type Story = StoryObj<MultiJointModel>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    upperArmAngle: 30,
    forearmAngle: 50,
    handAngle: 0,
    fingerAngle: 0,
    // speed: 0.2,
    // near: 1,
    // far: 10,
  },
};
export default meta;
