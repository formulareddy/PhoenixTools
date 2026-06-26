import { Header } from "@/components/layout/header"
import { Hero } from "@/components/home/hero"
import { PopularActions } from "@/components/home/popular-actions"
import { TrendingTools } from "@/components/home/trending-tools"
import { LiveDemo } from "@/components/home/live-demo"
import { BentoCategories } from "@/components/home/bento-categories"
import { AIWorkspace } from "@/components/home/ai-workspace"
import { Workflows } from "@/components/home/workflows"
import { ToolCollections } from "@/components/home/tool-collections"
import { TrustLayer } from "@/components/home/trust-layer"
import { Footer } from "@/components/layout/footer"

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <PopularActions />
      <TrendingTools />
      <LiveDemo />
      <BentoCategories />
      <AIWorkspace />
      <Workflows />
      <ToolCollections />
      <TrustLayer />
      <Footer />
    </>
  )
}
