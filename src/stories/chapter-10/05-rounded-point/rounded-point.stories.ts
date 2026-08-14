import type { Meta, StoryObj } from '@storybook/angular';
import { RoundedPoint } from './rounded-point';

const meta: Meta<RoundedPoint> = {
  title: 'WebGL/Глава 10/05 RoundedPoint',
  component: RoundedPoint,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<RoundedPoint>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
