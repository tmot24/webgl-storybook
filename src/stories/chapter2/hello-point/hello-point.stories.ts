import type { Meta, StoryObj } from '@storybook/angular';
import { HelloPoint } from './hello-point';

const meta: Meta<HelloPoint> = {
  title: 'WebGL/Глава 2/3 HelloPoint',
  component: HelloPoint,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<HelloPoint>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
