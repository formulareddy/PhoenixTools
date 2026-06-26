import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "pro"
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase",
        variant === "default" && "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC] border border-[rgba(255,255,255,0.06)]",
        variant === "pro" && "bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20",
        className
      )}
    >
      {children}
    </span>
  )
}
