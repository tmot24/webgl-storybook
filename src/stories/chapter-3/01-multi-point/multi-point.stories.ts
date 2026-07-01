import type { Meta, StoryObj } from '@storybook/angular';
import { MultiPoint } from './multi-point';

const meta: Meta<MultiPoint> = {
  title: 'WebGL/Глава 03/01 MultiPoint',
  component: MultiPoint,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<MultiPoint>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
