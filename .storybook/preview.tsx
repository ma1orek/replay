import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

/**
 * Storybook Preview Configuration
 * 
 * Features:
 * - Layout Decorator: Test components in different container contexts
 * - Dark Mode Sync: Synchronizes Tailwind dark class with theme toggle
 * - Design tokens imported from globals.css
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
        { name: "card", value: "#1f1f23" },
      ],
    },
    a11y: {
      test: "todo",
    },
    layout: "centered",
  },

  // === DECORATORS ===
  decorators: [
    (Story, context) => {
      const { layout, theme } = context.globals;

      // Dark Mode Sync - synchronize Tailwind 'dark' class with theme global
      React.useEffect(() => {
        const htmlTag = document.documentElement;
        if (theme === "dark") {
          htmlTag.classList.add("dark");
          htmlTag.classList.remove("light");
        } else {
          htmlTag.classList.remove("dark");
          htmlTag.classList.add("light");
        }
      }, [theme]);

      // Layout Context Switcher - test components in different containers
      let containerClassName = "w-full p-4 bg-background text-foreground min-h-[200px]";

      switch (layout) {
        case "sidebar":
          containerClassName = "w-[280px] border-r border-border h-[600px] p-4 bg-surface-sidebar";
          break;
        case "modal":
          containerClassName = "w-[480px] border border-border rounded-lg shadow-lg p-6 mx-auto bg-surface-card";
          break;
        case "narrow":
          containerClassName = "w-[320px] p-4 bg-background text-foreground";
          break;
        case "mobile":
          containerClassName = "w-[375px] p-4 bg-background text-foreground";
          break;
        case "tablet":
          containerClassName = "w-[768px] p-4 bg-background text-foreground";
          break;
        case "desktop":
          containerClassName = "w-[1280px] p-4 bg-background text-foreground";
          break;
        default:
          containerClassName = "w-full p-4 bg-background text-foreground";
      }

      return (
        <div className={containerClassName}>
          <Story />
        </div>
      );
    },
  ],

  // === GLOBAL TOOLBAR CONTROLS ===
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    layout: {
      name: "Layout Context",
      description: "Simulate different container contexts for RWD testing",
      defaultValue: "full",
      toolbar: {
        icon: "sidebar",
        items: [
          { value: "full", title: "Full Width" },
          { value: "desktop", title: "Desktop (1280px)" },
          { value: "tablet", title: "Tablet (768px)" },
          { value: "mobile", title: "Mobile (375px)" },
          { value: "sidebar", title: "Sidebar (280px)" },
          { value: "modal", title: "Modal (480px)" },
          { value: "narrow", title: "Narrow (320px)" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
