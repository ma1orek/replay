import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook Configuration Template
 * 
 * This is the base configuration used for per-project Storybook builds.
 * Variables like {{PROJECT_ID}} are replaced at build time.
 */
const config: StorybookConfig = {
  stories: ["../components/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-essentials",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: true,
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (config) => {
    // Optimize for smaller bundle size
    return {
      ...config,
      build: {
        ...config.build,
        minify: true,
        sourcemap: false,
      },
    };
  },
};

export default config;
