import type { Meta, StoryObj } from '@storybook/angular';
import { HelloTriangle } from './hello-triangle';

const meta: Meta<HelloTriangle> = {
  title: 'WebGL/Глава 03/02 HelloTriangle',
  component: HelloTriangle,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<HelloTriangle>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
