import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const variants = cva("studio-control", {
  variants: {
    variant: { default: "studio-primary", outline: "studio-button", ghost: "studio-icon" },
  },
  defaultVariants: { variant: "outline" },
});
export function Button({
  className,
  variant,
  asChild,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      type="button"
      className={twMerge(clsx(variants({ variant }), className))}
      {...props}
    />
  );
}
