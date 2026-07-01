import type { Meta, StoryObj } from '@storybook/angular';
import { TranslatedTriangle } from './translated-triangle';

const meta: Meta<TranslatedTriangle> = {
  title: 'WebGL/Глава 03/04 TranslatedTriangle',
  component: TranslatedTriangle,
  argTypes: {
    //   color: { control: 'color' },
    offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
  },
};

type Story = StoryObj<TranslatedTriangle>;
export const Main: Story = {
  args: {
    // color: '#ff0000',
    offsetX: 0.5,
    offsetY: 0.5,
  },
};
export default meta;
