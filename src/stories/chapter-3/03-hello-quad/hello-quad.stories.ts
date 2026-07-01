import type { Meta, StoryObj } from '@storybook/angular';
import { HelloQuad } from './hello-quad';

const meta: Meta<HelloQuad> = {
  title: 'WebGL/Глава 03/03 HelloQuad',
  component: HelloQuad,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<HelloQuad>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
