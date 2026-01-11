"use client";

import React, { useEffect, useMemo, useRef, useState, ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorRgbMap: Record<NonNullable<GlowCardProps["glowColor"]>, string> = {
  // Keep these as exact RGB values (used in gradients).
  blue: "59 130 246",     // #3B82F6
  purple: "168 85 247",   // #A855F7
  green: "34 197 94",     // #22C55E
  red: "239 68 68",       // #EF4444
  orange: "255 110 60",   // #FF6E3C (brand)
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'orange',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobileLike, setIsMobileLike] = useState(false);

  useEffect(() => {
    const compute = () => {
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
      const noHover = window.matchMedia?.("(hover: none)")?.matches ?? false;
      const small = window.innerWidth < 768;
      setIsMobileLike(coarse || noHover || small);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    if (isMobileLike) return;
    const el = cardRef.current;
    if (!el) return;

    const syncPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      el.style.setProperty('--x', x.toFixed(2));
      el.style.setProperty('--y', y.toFixed(2));
      el.style.setProperty('--xp', rect.width ? (x / rect.width).toFixed(2) : "0.5");
      el.style.setProperty('--yp', rect.height ? (y / rect.height).toFixed(2) : "0.5");
    };

    const onLeave = () => {
      // Reset to center so the glow doesn't get "stuck".
      el.style.setProperty('--x', (el.clientWidth / 2).toFixed(2));
      el.style.setProperty('--y', (el.clientHeight / 2).toFixed(2));
      el.style.setProperty('--xp', "0.5");
      el.style.setProperty('--yp', "0.5");
    };

    onLeave();
    el.addEventListener('pointermove', syncPointer);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', syncPointer);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [isMobileLike]);

  const glowRgb = glowColorRgbMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) {
      return '';
    }
    return sizeMap[size];
  };

  const inlineStyles = useMemo(() => {
    const baseStyles: any = {
      '--glow-rgb': glowRgb,
      '--radius': '14',
      '--border': '1',
      '--backdrop': 'hsl(0 0% 2% / 0.98)', // Darker background
      '--backup-border': 'hsl(0 0% 15% / 0.3)',
      '--size': '200',
      '--outer': '1',
      '--bg-spot-opacity': '0', // NO inner glow fill (border-only)
      '--border-spot-opacity': '0.95',
      '--border-light-opacity': '0.65',
      '--border-size': 'calc(var(--border, 1) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
    };

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  }, [glowRgb, height, width]);

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        rgb(var(--glow-rgb) / var(--border-spot-opacity, 0.8)), transparent 100%
      );
      filter: brightness(1.5);
    }
    
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        rgb(var(--glow-rgb) / var(--border-light-opacity, 0.45)), transparent 100%
      );
    }
  `;

  // Mobile / coarse pointers: NO glow, NO hover tracking — just a clean static card.
  if (isMobileLike) {
    const style: React.CSSProperties = {};
    if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
    if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;

    return (
      <div
        style={style}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl
          relative
          overflow-hidden
          grid
          grid-rows-[1fr_auto]
          shadow-[0_1rem_2rem_-1rem_black]
          p-4
          gap-4
          border border-white/10
          bg-[hsl(0_0%_2%/0.98)]
          ${className}
        `}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={inlineStyles}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl 
          relative 
          grid 
          grid-rows-[1fr_auto] 
          shadow-[0_1rem_2rem_-1rem_black] 
          p-4 
          gap-4 
          ${className}
        `}
      >
        {children}
      </div>
    </>
  );
};

export { GlowCard }
