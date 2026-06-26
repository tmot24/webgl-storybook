import type { Meta, StoryObj } from '@storybook/angular';
import { HelloPoint1 } from './hello-point-1';

const meta: Meta<HelloPoint1> = {
  title: 'WebGL/Глава 2/3 HelloPoint1',
  component: HelloPoint1,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<HelloPoint1>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
