import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';

import { EvolutionPhase } from '../types';

interface GemProps {
  insightCount: number;
  phase: EvolutionPhase | 'IDLE' | null;
}

const Gem: React.FC<GemProps> = ({ insightCount, phase }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color1 = new THREE.Color(0x3b82f6); // Sky/Blue
  const color2 = new THREE.Color(0x22d3ee); // Cyan
  const mutationColor = new THREE.Color(0xf59e0b); // Amber
  const coherenceColor = new THREE.Color(0xffffff); // White (Purity)
  const debateColor = new THREE.Color(0x8b5cf6); // Purple

  const growthFactor = useMemo(() => Math.min(insightCount / 50, 1), [insightCount]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      const rotSpeed = phase === 'MUTATION' ? 0.02 : phase === 'COHERENCE' ? 0.001 : 0.005;
      meshRef.current.rotation.x += rotSpeed;
      meshRef.current.rotation.y += rotSpeed * 0.7;

      if (phase === 'DEBATE') {
        meshRef.current.position.y = Math.sin(time * 5) * 0.05;
      } else {
        meshRef.current.position.y = Math.sin(time) * 0.02;
      }

      const scale = 1.0 + (growthFactor * 0.2) + (phase === 'MUTATION' ? Math.sin(time * 10) * 0.02 : 0);
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

      let targetColor = color1.clone().lerp(color2, growthFactor);
      if (phase === 'MUTATION') targetColor = mutationColor;
      if (phase === 'COHERENCE') targetColor = coherenceColor;
      if (phase === 'DEBATE') targetColor = debateColor;

      (meshRef.current.material as THREE.MeshPhysicalMaterial).color.lerp(targetColor, 0.1);
      (meshRef.current.material as THREE.MeshPhysicalMaterial).opacity = 0.6 + (growthFactor * 0.3);
      (meshRef.current.material as THREE.MeshPhysicalMaterial).emissive = targetColor;
      (meshRef.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = phase ? 0.5 : 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[1]} />
      <meshPhysicalMaterial
        color={0x3b82f6}
        metalness={0.9}
        roughness={0.1}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        reflectivity={0.5}
        transparent
        opacity={0.6}
        flatShading
      />
    </mesh>
  );
};

export const ThreeGem: React.FC<{ insightCount: number; mutationCount: number; phase: EvolutionPhase | 'IDLE' | null }> = ({ insightCount, mutationCount, phase }) => {
  return (
    <div id="core-gem-container" className="h-[250px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 shadow-inner border border-slate-700/50">
      <Canvas gl={{ alpha: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 2.5]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#38bdf8" />
        <Gem insightCount={insightCount + mutationCount} phase={phase} />
      </Canvas>
    </div>
  );
};
