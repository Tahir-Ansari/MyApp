import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Solid emerald with dark text: the one loud thing on a screen. */
        primary:
          "bg-accent text-accent-foreground font-semibold hover:bg-accent-strong active:bg-accent-deep active:text-foreground",
        /* Dark surface with a subtle border. */
        secondary:
          "border border-border bg-surface-2 text-foreground hover:border-accent-border hover:bg-surface-3",
        /* Tertiary: transparent, muted text. */
        ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
        outline: "border border-border-strong bg-transparent text-foreground hover:border-accent-border hover:bg-surface-2",
        success: "border border-accent-border bg-accent-soft text-accent-strong hover:bg-accent/15",
        /* Restrained destructive styling: tinted, not a red slab. */
        danger: "border border-danger/30 bg-danger-soft text-danger hover:border-danger/50 hover:bg-danger/15",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}

export { buttonVariants };
