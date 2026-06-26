"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { SubscriptionProvider } from "@/contexts/subscription-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </AuthProvider>
  )
}
