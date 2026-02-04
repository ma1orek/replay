import type { Meta, StoryObj } from "@storybook/react";
import { Rocket, ArrowRight, Download, Trash2, Mail, Plus, ExternalLink } from "lucide-react";
import { Button } from "./button";

/**
 * Primary button component for user interactions.
 * 
 * Built with:
 * - Radix UI Slot for polymorphic rendering
 * - Class Variance Authority for variant management
 * - Full keyboard navigation and focus management
 */
const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A versatile button component supporting multiple variants, sizes, icons, and loading states.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "success", "orange", "orange-outline", "dark", "dark-outline"],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "xl", "icon", "icon-sm", "icon-lg"],
      description: "Button size",
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading spinner and disables button",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
    },
    asChild: {
      control: "boolean",
      description: "Render as child element (for links)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// === BASIC VARIANTS ===

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
    icon: <Trash2 className="w-4 h-4" />,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Button",
  },
};

// === ACCENT VARIANTS ===

export const Orange: Story = {
  args: {
    variant: "orange",
    children: "Get Started",
    icon: <Rocket className="w-4 h-4" />,
  },
};

export const OrangeOutline: Story = {
  args: {
    variant: "orange-outline",
    children: "Learn More",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Confirm",
  },
};

// === WITH ICONS ===

export const WithLeftIcon: Story = {
  args: {
    children: "Download",
    icon: <Download className="w-4 h-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Continue",
    iconRight: <ArrowRight className="w-4 h-4" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: "Send Email",
    icon: <Mail className="w-4 h-4" />,
    iconRight: <ExternalLink className="w-4 h-4" />,
  },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    icon: <Plus className="w-4 h-4" />,
    "aria-label": "Add item",
  },
};

// === SIZES ===

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    children: "Extra Large",
  },
};

// === STATES ===

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Saving...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};

// === ALL VARIANTS SHOWCASE ===

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive">Destructive</Button>
        <Button variant="success">Success</Button>
        <Button variant="orange">Orange</Button>
        <Button variant="orange-outline">Orange Outline</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="dark">Dark</Button>
        <Button variant="dark-outline">Dark Outline</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available button variants displayed together.",
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available button sizes displayed together.",
      },
    },
  },
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="icon-sm" variant="ghost">
        <Plus className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="outline">
        <Download className="w-4 h-4" />
      </Button>
      <Button size="icon-lg" variant="secondary">
        <Rocket className="w-5 h-5" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icon-only buttons in different sizes.",
      },
    },
  },
};
