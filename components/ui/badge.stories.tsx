import type { Meta, StoryObj } from "@storybook/react";
import { Check, AlertCircle, Info, Clock, Star, Zap, X } from "lucide-react";
import { Badge } from "./badge";

/**
 * Badge component for displaying status, labels, or counts.
 */
const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A badge component for displaying status indicators, labels, tags, or counts.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "success", "warning", "info", "orange"],
      description: "Visual style variant",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// === BASIC VARIANTS ===

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

// === STATUS VARIANTS ===

export const Success: Story = {
  args: {
    variant: "success",
    children: "Active",
    icon: <Check className="w-3 h-3" />,
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Pending",
    icon: <Clock className="w-3 h-3" />,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Error",
    icon: <X className="w-3 h-3" />,
  },
};

export const InfoBadge: Story = {
  args: {
    variant: "info",
    children: "Information",
    icon: <Info className="w-3 h-3" />,
  },
};

export const Orange: Story = {
  args: {
    variant: "orange",
    children: "Featured",
    icon: <Star className="w-3 h-3" />,
  },
};

// === WITH ICONS ===

export const WithIcon: Story = {
  args: {
    children: "Verified",
    icon: <Check className="w-3 h-3" />,
    variant: "success",
  },
};

export const AlertBadge: Story = {
  args: {
    children: "Attention Required",
    icon: <AlertCircle className="w-3 h-3" />,
    variant: "warning",
  },
};

export const ProBadge: Story = {
  args: {
    children: "Pro",
    icon: <Zap className="w-3 h-3" />,
    variant: "orange",
  },
};

// === ALL VARIANTS SHOWCASE ===

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="orange">Orange</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available badge variants displayed together.",
      },
    },
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" icon={<Check className="w-3 h-3" />}>
        Active
      </Badge>
      <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
        Pending
      </Badge>
      <Badge variant="destructive" icon={<X className="w-3 h-3" />}>
        Inactive
      </Badge>
      <Badge variant="info" icon={<Info className="w-3 h-3" />}>
        Draft
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Status badges with icons for different states.",
      },
    },
  },
};

export const TagList: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">React</Badge>
      <Badge variant="outline">TypeScript</Badge>
      <Badge variant="outline">Tailwind</Badge>
      <Badge variant="outline">Next.js</Badge>
      <Badge variant="outline">Storybook</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badges used as tags in a list.",
      },
    },
  },
};

export const PricingTiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">Free</Badge>
      <Badge variant="orange" icon={<Zap className="w-3 h-3" />}>
        Pro
      </Badge>
      <Badge variant="default" icon={<Star className="w-3 h-3" />}>
        Enterprise
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badges used for pricing tier labels.",
      },
    },
  },
};
