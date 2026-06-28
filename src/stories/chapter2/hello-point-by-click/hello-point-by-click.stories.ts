import type { Meta, StoryObj } from '@storybook/angular';
import { HelloPointByClick } from './hello-point-by-click';

const meta: Meta<HelloPointByClick> = {
  title: 'WebGL/Глава 2/4 HelloPointByClick',
  component: HelloPointByClick,
  // argTypes: {
  //   color: { control: 'color' },
  //   offsetXY: { control: { type: 'range', min: 0, max: 100, step: 10 } },
  // },
};

type Story = StoryObj<HelloPointByClick>;
export const Main: Story = {
  // args: {
  //   color: '#ff0000',
  //   offsetXY: 0,
  // },
};
export default meta;
