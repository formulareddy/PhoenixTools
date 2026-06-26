"use client"

import { useEffect, useRef } from "react"
import lottie from "lottie-web"

interface LottiePlayerProps {
  src: string
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export function LottiePlayer({ src, className = "", loop = true, autoplay = true }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop,
      autoplay,
      path: src,
    })

    return () => {
      animRef.current?.destroy()
    }
  }, [src, loop, autoplay])

  return <div ref={containerRef} className={className} />
}
