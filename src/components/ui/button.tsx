import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0E0A] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#D97757] text-[#0F0E0A] hover:bg-[#D97757]/90",
        secondary: "bg-[rgba(255,255,255,0.04)] text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)]",
        ghost: "text-[#BEB7AC] hover:text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.04)]",
        outline: "border border-[rgba(255,255,255,0.06)] bg-transparent text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.04)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
