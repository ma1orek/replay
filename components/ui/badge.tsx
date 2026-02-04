import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        /** Default badge with primary styling */
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        /** Secondary badge with muted styling */
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /** Destructive badge for errors/warnings */
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        /** Outline badge with border only */
        outline: "text-foreground border-border",
        /** Success badge for positive states */
        success: "border-transparent bg-success/15 text-success",
        /** Warning badge for attention states */
        warning: "border-transparent bg-warning/15 text-warning",
        /** Info badge for informational states */
        info: "border-transparent bg-info/15 text-info",
        /** Orange accent badge */
        orange: "border-transparent bg-orange-500/15 text-orange-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

/**
 * Badge component for displaying status, labels, or counts.
 * 
 * Features:
 * - Multiple color variants for different contexts
 * - Optional icon support
 * - Pill-shaped design with rounded corners
 * 
 * @example
 * // Basic usage
 * <Badge>New</Badge>
 * 
 * @example
 * // With variant
 * <Badge variant="success">Active</Badge>
 * 
 * @example
 * // With icon
 * <Badge icon={<Check className="w-3 h-3" />} variant="success">
 *   Verified
 * </Badge>
 * 
 * @example
 * // Status badge
 * <Badge variant="warning">Pending Review</Badge>
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon element displayed before the badge text.
   * Should be a small icon like <Check className="w-3 h-3" />
   */
  icon?: React.ReactNode
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
