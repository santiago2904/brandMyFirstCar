'use client'

import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF } from '@react-three/drei'
import type { Spot } from '@/lib/types'

const MODEL_URL = '/models/mazda-3.glb'
const TARGET_LENGTH = 4.2 // meters — normalizes whatever units the source file uses

// Zone anchors as fractions of the normalized model: x/z are fractions of
// half-width/half-length (0 = center, ±1 = edge), y is a fraction of TOTAL
// height (0 = ground, 1 = roof). Eyeballed against the rendered model, not
// measured from real part positions — adjust here if a badge lands wrong.
const ZONE_FRACTIONS: Record<string, [number, number, number]> = {
  Capó: [0, 0.32, 0.65],
  'Puerta izquierda': [-1.0, 0.25, 0],
  'Puerta derecha': [1.0, 0.25, 0],
  Baúl: [0, 0.35, -0.65],
  'Parachoques trasero': [0, 0.08, -0.92],
  Espejos: [-1.0, 0.55, 0.35],
}

function useNormalizedModel() {
  const { scene } = useGLTF(MODEL_URL)

  // Pure derivation: clone once per loaded scene, scale/re-center the clone
  // (a fresh object nothing else references yet), and measure it. Memoized
  // so this only re-runs if the loaded GLTF scene itself changes.
  return useMemo(() => {
    const object = scene.clone()

    const rawBox = new THREE.Box3().setFromObject(object)
    const rawSize = new THREE.Vector3()
    rawBox.getSize(rawSize)
    const scale = TARGET_LENGTH / Math.max(rawSize.x, rawSize.z, 0.0001)
    object.scale.setScalar(scale)

    const scaledBox = new THREE.Box3().setFromObject(object)
    const center = new THREE.Vector3()
    scaledBox.getCenter(center)
    object.position.set(-center.x, -scaledBox.min.y, -center.z)

    const finalBox = new THREE.Box3().setFromObject(object)
    const halfExtents = finalBox.getSize(new THREE.Vector3()).multiplyScalar(0.5)

    return { object, halfExtents }
  }, [scene])
}

useGLTF.preload(MODEL_URL)

function ZoneBadge({
  spot,
  halfExtents,
}: {
  spot: Spot
  halfExtents: THREE.Vector3
}) {
  const [fx, fy, fz] = ZONE_FRACTIONS[spot.zone_name] ?? [0, 0.5, 0]
  const position: [number, number, number] = [
    fx * halfExtents.x,
    fy * halfExtents.y * 2, // fy is a fraction of total height (ground to roof)
    fz * halfExtents.z,
  ]
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

function CarModel({ spots }: { spots: Spot[] }) {
  const { object, halfExtents } = useNormalizedModel()

  return (
    <>
      <primitive object={object} />
      {spots.map((spot) => (
        <ZoneBadge key={spot.id} spot={spot} halfExtents={halfExtents} />
      ))}
    </>
  )
}

export function CarScene({ spots }: { spots: Spot[] }) {
  return (
    <div className="h-[26rem] w-full sm:h-[32rem]">
      <Canvas camera={{ position: [3.4, 1.7, 4], fov: 35 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 5]} intensity={1} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <Suspense fallback={null}>
          <CarModel spots={spots} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0.6, 0]}
        />
      </Canvas>
    </div>
  )
}
