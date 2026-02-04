import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Search, Lock, User, CreditCard, Phone } from "lucide-react";
import { Input } from "./input";

/**
 * Form input component with support for icons and error states.
 */
const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A versatile input component supporting icons, error states, and various input types.",
      },
    },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
      description: "HTML input type",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input",
    },
    error: {
      control: "text",
      description: "Error message (enables error styling)",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

// === BASIC ===

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Hello World",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

// === WITH ICONS ===

export const WithIcon: Story = {
  args: {
    icon: <Mail className="w-4 h-4" />,
    placeholder: "Enter your email",
    type: "email",
  },
};

export const SearchInput: Story = {
  args: {
    icon: <Search className="w-4 h-4" />,
    placeholder: "Search...",
    type: "search",
  },
};

export const PasswordInput: Story = {
  args: {
    icon: <Lock className="w-4 h-4" />,
    placeholder: "Enter password",
    type: "password",
  },
};

// === ERROR STATES ===

export const WithError: Story = {
  args: {
    placeholder: "Enter email",
    error: "Please enter a valid email address",
    defaultValue: "invalid-email",
  },
};

export const WithIconAndError: Story = {
  args: {
    icon: <Mail className="w-4 h-4" />,
    placeholder: "Enter email",
    error: "This email is already registered",
    defaultValue: "john@example.com",
  },
};

// === INPUT TYPES ===

export const EmailInput: Story = {
  args: {
    icon: <Mail className="w-4 h-4" />,
    type: "email",
    placeholder: "john@example.com",
  },
};

export const PhoneInput: Story = {
  args: {
    icon: <Phone className="w-4 h-4" />,
    type: "tel",
    placeholder: "+1 (555) 000-0000",
  },
};

export const NumberInput: Story = {
  args: {
    type: "number",
    placeholder: "0",
    min: 0,
    max: 100,
  },
};

// === FORM EXAMPLES ===

export const LoginForm: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Email
        </label>
        <Input
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Password
        </label>
        <Input
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder="Enter your password"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of inputs used in a login form.",
      },
    },
  },
};

export const ProfileForm: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Full Name
        </label>
        <Input
          icon={<User className="w-4 h-4" />}
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Email
        </label>
        <Input
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="john@example.com"
          error="This email is already taken"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Credit Card
        </label>
        <Input
          icon={<CreditCard className="w-4 h-4" />}
          placeholder="4242 4242 4242 4242"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of inputs used in a profile form with validation error.",
      },
    },
  },
};
