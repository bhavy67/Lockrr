import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus-ring",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary/10 text-primary",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        destructive:
          "border border-transparent bg-destructive/10 text-destructive",
        warning:
          "border border-transparent bg-warning/10 text-warning",
        success:
          "border border-transparent bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
