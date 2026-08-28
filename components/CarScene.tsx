'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import type { Spot } from '@/lib/types'

// Approximate anchor points for each zone on the procedural car body below.
// Placeholder positions — swap for real coordinates once the car has actual
// photos/measurements.
const ZONE_POSITIONS: Record<string, [number, number, number]> = {
  Capó: [0, 0.75, 1.5],
  'Puerta izquierda': [-1.02, 0.5, 0],
  'Puerta derecha': [1.02, 0.5, 0],
  Baúl: [0, 0.75, -1.7],
  'Parachoques trasero': [0, 0.25, -2.15],
  Espejos: [-1.08, 0.75, 0.9],
}

const WHEEL_POSITIONS: [number, number, number][] = [
  [-0.9, 0, 1.3],
  [0.9, 0, 1.3],
  [-0.9, 0, -1.3],
  [0.9, 0, -1.3],
]

function CarBody() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[2, 0.5, 4]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <mesh position={[0, 0.85, -0.15]}>
        <boxGeometry args={[1.7, 0.5, 2]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>
      {WHEEL_POSITIONS.map((position, i) => (
        <mesh key={i} position={position} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 20]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
    </group>
  )
}

function ZoneBadge({ spot }: { spot: Spot }) {
  const position = ZONE_POSITIONS[spot.zone_name] ?? [0, 1, 0]
  const logoUrl = spot.current_leader?.logo_url

  return (
    <Html position={position} center distanceFactor={7} zIndexRange={[10, 0]}>
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-background shadow-md">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={spot.current_leader?.brand_name ?? spot.zone_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[9px] font-medium text-muted">
            ${spot.current_bid ?? spot.starting_price}
          </span>
        )}
      </div>
    </Html>
  )
}

export function CarScene({ spots }: { spots: Spot[] }) {
  return (
    <div className="h-64 w-full sm:h-80">
      <Canvas camera={{ position: [4, 2.4, 5], fov: 40 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 6, 5]} intensity={0.9} />
        <CarBody />
        {spots.map((spot) => (
          <ZoneBadge key={spot.id} spot={spot} />
        ))}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  )
}
