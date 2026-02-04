import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Primary action button with accent color */
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        /** Dangerous/destructive action (delete, remove) */
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        /** Outlined button for secondary actions */
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        /** Secondary button with muted styling */
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /** Minimal button with no background */
        ghost: "hover:bg-accent hover:text-accent-foreground",
        /** Text-only button that looks like a link */
        link: "text-primary underline-offset-4 hover:underline",
        /** Success action button */
        success: "bg-success text-white hover:bg-success/90 shadow-sm",
        /** Orange accent button for CTAs */
        orange: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5",
        /** Orange outline variant */
        "orange-outline": "border-2 border-orange-500 text-orange-500 hover:bg-orange-500/10",
        /** Dark solid button */
        dark: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg",
        /** Dark outline button */
        "dark-outline": "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
      },
      size: {
        /** Default size - 40px height */
        default: "h-10 px-4 py-2 rounded-full",
        /** Small - 36px height */
        sm: "h-9 rounded-full px-4 text-xs",
        /** Large - 48px height */
        lg: "h-12 rounded-full px-8 text-base",
        /** Extra large - 56px height */
        xl: "h-14 rounded-full px-10 text-lg",
        /** Icon only - square button */
        icon: "h-10 w-10 rounded-full",
        /** Small icon - 36px square */
        "icon-sm": "h-9 w-9 rounded-full",
        /** Large icon - 48px square */
        "icon-lg": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

/**
 * Primary button component for user interactions.
 * 
 * Supports multiple variants, sizes, and optional icons.
 * Built on top of Radix UI Slot for polymorphic rendering.
 * 
 * @example
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * @example
 * // With icon
 * <Button icon={<Rocket className="w-4 h-4" />}>Launch</Button>
 * 
 * @example
 * // Loading state
 * <Button isLoading>Saving...</Button>
 * 
 * @example
 * // As link
 * <Button asChild>
 *   <a href="/dashboard">Go to Dashboard</a>
 * </Button>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 
   * Render as child element using Radix Slot.
   * Useful for rendering as <a> or other elements.
   */
  asChild?: boolean
  
  /** 
   * Icon element displayed before children.
   * Should be a React element like <Rocket className="w-4 h-4" />
   */
  icon?: React.ReactNode
  
  /** 
   * Icon element displayed after children.
   * Useful for arrow icons or external link indicators.
   */
  iconRight?: React.ReactNode
  
  /** 
   * Loading state - disables button and shows spinner.
   * Replaces the left icon with a spinning loader.
   */
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    icon,
    iconRight,
    isLoading = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // When asChild is true, Slot expects a single child element
    // So we don't add icons in that case - the child handles its own content
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
        {iconRight && !isLoading ? iconRight : null}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
