"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "transition-bg relative flex flex-col items-center justify-center",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          {
            // Custom orange/red aurora colors to match Replay branding
            "--aurora":
              "repeating-linear-gradient(100deg,#FF6E3C_10%,#FF8A5B_15%,#FF6E3C_20%,#FF5722_25%,#FF7043_30%)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,#030303_0%,#030303_7%,transparent_10%,transparent_12%,#030303_16%)",

            "--orange-primary": "#FF6E3C",
            "--orange-light": "#FF8A5B",
            "--orange-dark": "#FF5722",
            "--orange-warm": "#FF7043",
            "--black": "#030303",
            "--transparent": "transparent",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] opacity-40 blur-[10px] will-change-transform`,
            `[background-image:var(--dark-gradient),var(--aurora)]`,
            `[background-size:300%,_200%]`,
            `[background-position:50%_50%,50%_50%]`,
            `after:absolute after:inset-0`,
            `after:[background-image:var(--dark-gradient),var(--aurora)]`,
            `after:[background-size:200%,_100%]`,
            `after:[background-attachment:fixed]`,
            `after:mix-blend-soft-light`,
            `after:content-[""]`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};


