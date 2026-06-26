"use client"

interface Orb {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
  duration: number
}

function seeded(i: number, offset: number) {
  return ((i * 12.9898 + offset * 78.233) % 1 + 1) / 2
}

const ORBS: Orb[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  x: seeded(i, 0) * 100,
  y: seeded(i, 1) * 100,
  size: 200 + seeded(i, 2) * 300,
  color: ["#6366F1", "#8B5CF6", "#06B6D4", "#6366F1", "#8B5CF6"][i],
  delay: seeded(i, 3) * 5,
  duration: 8 + seeded(i, 4) * 12,
}))

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {ORBS.map((orb) => (
        <div
          key={orb.id}
          className="floating-orb"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}20, ${orb.color}05, transparent)`,
            animation: `float ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
