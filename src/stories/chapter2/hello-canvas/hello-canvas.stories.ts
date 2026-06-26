import type { Meta, StoryObj } from '@storybook/angular';
import { HelloCanvas } from './hello-canvas';

const meta: Meta<HelloCanvas> = {
  title: 'WebGL/Глава 2/2 HelloCanvas',
  component: HelloCanvas,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<HelloCanvas>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
