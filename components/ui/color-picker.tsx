'use client';

import {
  type HexColor,
  hexToHsva,
  type HslaColor,
  hslaToHsva,
  type HsvaColor,
  hsvaToHex,
  hsvaToHsla,
  hsvaToHslString,
  hsvaToRgba,
  type RgbaColor,
  rgbaToHsva,
} from '@uiw/color-convert';
import Hue from '@uiw/react-color-hue';
import Saturation from '@uiw/react-color-saturation';
import { CheckIcon, XIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

function getColorAsHsva(color: string | HsvaColor | HslaColor | RgbaColor): HsvaColor {
  if (typeof color === 'string') {
    try {
      return hexToHsva(color);
    } catch {
      return { h: 0, s: 0, v: 100, a: 1 };
    }
  } else if ('h' in color && 's' in color && 'v' in color) {
    return color;
  } else if ('r' in color) {
    return rgbaToHsva(color);
  } else {
    return hslaToHsva(color);
  }
}

type ColorPickerValue = {
  hex: string;
  hsl: HslaColor;
  rgb: RgbaColor;
};

type ColorPickerProps = {
  value?: string;
  swatches?: HexColor[];
  hideContrastRatio?: boolean;
  hideSwatches?: boolean;
  className?: string;
  onValueChange?: (value: ColorPickerValue) => void;
};

function ColorPicker({
  value,
  swatches = [],
  hideContrastRatio,
  hideSwatches,
  onValueChange,
  className,
}: ColorPickerProps) {
  const [colorType, setColorType] = React.useState<'hex' | 'rgb'>('hex');
  const [colorHsv, setColorHsv] = React.useState<HsvaColor>(() => 
    value ? getColorAsHsva(value) : { h: 0, s: 100, v: 100, a: 1 }
  );

  // Sync with external value
  React.useEffect(() => {
    if (value) {
      const newHsv = getColorAsHsva(value);
      setColorHsv(newHsv);
    }
  }, [value]);

  const handleValueChange = React.useCallback((color: HsvaColor) => {
    setColorHsv(color);
    onValueChange?.({
      hex: hsvaToHex(color),
      hsl: hsvaToHsla(color),
      rgb: hsvaToRgba(color),
    });
  }, [onValueChange]);

  const rgb = hsvaToRgba(colorHsv);
  const hex = hsvaToHex(colorHsv);

  const defaultSwatches: HexColor[] = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'];

  return (
    <div 
      className={cn('w-[280px] p-3 space-y-3', className)}
      style={{ '--selected-color': hsvaToHslString(colorHsv) } as React.CSSProperties}
    >
      {/* Saturation picker */}
      <Saturation
        hsva={colorHsv}
        onChange={handleValueChange}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '16/9',
          borderRadius: '8px',
        }}
        className="border border-zinc-700/50 overflow-hidden"
      />
      
      {/* Hue slider */}
      <Hue
        hue={colorHsv.h}
        onChange={(newHue) => handleValueChange({ ...colorHsv, ...newHue })}
        className="[&>div:first-child]:overflow-hidden [&>div:first-child]:!rounded-md"
        style={{
          width: '100%',
          height: '12px',
          borderRadius: '6px',
        }}
      />

      {/* Color type toggle & inputs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setColorType(colorType === 'hex' ? 'rgb' : 'hex')}
          className="shrink-0 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700/50"
        >
          {colorType}
        </button>
        
        {colorType === 'hex' ? (
          <input
            type="text"
            value={hex}
            onChange={(e) => {
              try {
                const newHsv = hexToHsva(e.target.value);
                handleValueChange(newHsv);
              } catch {}
            }}
            className="flex-1 h-7 px-2 text-xs font-mono bg-zinc-800 border border-zinc-700/50 rounded text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        ) : (
          <div className="flex-1 flex gap-1">
            <div className="flex-1 relative">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.r}
                onChange={(e) => handleValueChange(rgbaToHsva({ ...rgb, r: Number(e.target.value) }))}
                className="w-full h-7 px-1.5 text-xs font-mono text-center bg-zinc-800 border border-zinc-700/50 rounded-l text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500 uppercase">R</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.g}
                onChange={(e) => handleValueChange(rgbaToHsva({ ...rgb, g: Number(e.target.value) }))}
                className="w-full h-7 px-1.5 text-xs font-mono text-center bg-zinc-800 border-y border-zinc-700/50 text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500 uppercase">G</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb.b}
                onChange={(e) => handleValueChange(rgbaToHsva({ ...rgb, b: Number(e.target.value) }))}
                className="w-full h-7 px-1.5 text-xs font-mono text-center bg-zinc-800 border border-zinc-700/50 rounded-r text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500 uppercase">B</span>
            </div>
          </div>
        )}
      </div>

      {/* Swatches */}
      {!hideSwatches && (
        <div className="pt-2 border-t border-zinc-700/50">
          <div className="flex flex-wrap gap-1.5">
            {[...defaultSwatches, ...swatches].map((color, i) => (
              <button
                key={`${color}-${i}`}
                onClick={() => handleValueChange(hexToHsva(color))}
                className={cn(
                  "w-5 h-5 rounded-md border transition-all hover:scale-110",
                  hex.toLowerCase() === color.toLowerCase() 
                    ? "border-white ring-1 ring-white/50" 
                    : "border-zinc-600/50 hover:border-zinc-500"
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contrast Ratio */}
      {!hideContrastRatio && (
        <ContrastRatio color={colorHsv} />
      )}
    </div>
  );
}

function ContrastRatio({ color }: { color: HsvaColor }) {
  const rgb = hsvaToRgba(color);

  const toSRGB = (c: number) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const r = toSRGB(rgb.r);
  const g = toSRGB(rgb.g);
  const b = toSRGB(rgb.b);

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  const darkModeRatio = Number(((1.0 + 0.05) / (luminance + 0.05)).toFixed(2));
  const lightModeRatio = Number(((luminance + 0.05) / 0.05).toFixed(2));

  // Use dark mode ratio since our UI is dark
  const ratio = darkModeRatio;
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7;

  return (
    <div className="pt-2 border-t border-zinc-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: `var(--selected-color)` }}
          >
            <span className="text-white mix-blend-difference">A</span>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Contrast</div>
            <div className="text-sm font-mono text-zinc-200">{ratio}:1</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span 
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1",
              passesAA 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-zinc-700 text-zinc-500"
            )}
          >
            {passesAA ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
            AA
          </span>
          <span 
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1",
              passesAAA 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-zinc-700 text-zinc-500"
            )}
          >
            {passesAAA ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
            AAA
          </span>
        </div>
      </div>
    </div>
  );
}

export { ColorPicker };
export type { ColorPickerProps, ColorPickerValue };
