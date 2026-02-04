import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: [
    // Components stories
    "../components/ui/**/*.stories.@(ts|tsx)",
    "../components/**/*.stories.@(ts|tsx)",
    // Documentation
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../docs/**/*.mdx",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook",
    "@storybook/addon-onboarding",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  docs: {
    autodocs: "tag", // Auto-generate docs from JSDoc comments
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;