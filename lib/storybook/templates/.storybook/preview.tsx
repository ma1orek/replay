import React from "react";
import type { Preview } from "@storybook/react";

/**
 * Storybook Preview Configuration Template
 * 
 * Configures the preview iframe for component stories.
 * Variables like {{PROJECT_TITLE}} are replaced at build time.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#111111" },
        { name: "light", value: "#ffffff" },
        { name: "gray", value: "#1f1f23" },
      ],
    },
    layout: "centered",
    docs: {
      toc: true,
    },
  },
  
  decorators: [
    (Story, context) => {
      const { theme } = context.globals;
      
      // Apply theme class
      React.useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
          root.classList.add("dark");
          root.classList.remove("light");
        } else {
          root.classList.remove("dark");
          root.classList.add("light");
        }
      }, [theme]);

      return (
        <div className="p-4">
          <Story />
        </div>
      );
    },
  ],

  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme",
      defaultValue: "dark",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
