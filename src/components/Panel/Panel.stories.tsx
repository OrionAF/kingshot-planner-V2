import type { Meta, StoryObj } from '@storybook/react'
import { Panel } from './Panel'

// This Meta object describes your component.
const meta: Meta<typeof Panel> = {
  title: 'Components/Panel', // How it will appear in the Storybook sidebar
  component: Panel,
  tags: ['autodocs'], // Enables automatic documentation
}

export default meta
type Story = StoryObj<typeof Panel>

// This is the "story" for a default panel.
export const Default: Story = {
  args: {
    // The `children` are the content inside the panel.
    children: (
      <div>
        <h4>A Section Title</h4>
        <p>This is some content inside a generic panel.</p>
        <button>Click me</button>
      </div>
    ),
  },
}
