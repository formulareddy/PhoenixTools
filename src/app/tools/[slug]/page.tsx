import { Header } from "@/components/layout/header"

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <>
      <Header />
      <div>Tool: {slug}</div>
    </>
  )
}
