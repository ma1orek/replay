import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Form input component with support for icons, error states, and variants.
 * 
 * Features:
 * - Optional left icon for visual context
 * - Error state styling with error message
 * - Dark theme optimized
 * - Full accessibility support
 * 
 * @example
 * // Basic usage
 * <Input placeholder="Enter your email" />
 * 
 * @example
 * // With icon
 * <Input icon={<Mail className="w-4 h-4" />} placeholder="Email" />
 * 
 * @example
 * // With error
 * <Input error="Invalid email address" placeholder="Email" />
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 
   * Icon element displayed on the left side of the input.
   * Should be a React element like <Mail className="w-4 h-4" />
   */
  icon?: React.ReactNode
  
  /** 
   * Error message to display below the input.
   * When set, input gets error styling (red border).
   */
  error?: string
  
  /**
   * Additional wrapper className for the container div.
   * Use when you need to style the wrapper (e.g., width).
   */
  wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, wrapperClassName, ...props }, ref) => {
    const hasIcon = !!icon
    const hasError = !!error
    
    return (
      <div className={cn("relative", wrapperClassName)}>
        {hasIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-md border bg-surface-input px-3 py-2 text-sm text-text-primary",
            "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-text-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            // Border colors
            hasError 
              ? "border-destructive focus-visible:ring-destructive" 
              : "border-border-default hover:border-border-strong focus-visible:border-border-focus",
            // Icon padding
            hasIcon && "pl-10",
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id}-error` : undefined}
          {...props}
        />
        {hasError && (
          <p 
            id={`${props.id}-error`}
            className="mt-1.5 text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
