import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "glass-subtle text-foreground border-glass-border/50 bg-primary/10 hover:bg-primary/20",
        secondary: "glass-subtle border-glass-border/40 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground",
        destructive: "glass-subtle border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground",
        outline: "glass-subtle text-foreground border-glass-border/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
