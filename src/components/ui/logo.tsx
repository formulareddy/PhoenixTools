import Image from "next/image"

export function Logo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <Image
      src="/phoenix-logo.png"
      alt="PhoenixTools"
      width={20}
      height={20}
      className={className}
      priority
    />
  )
}
