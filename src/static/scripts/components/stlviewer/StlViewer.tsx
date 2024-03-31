import React, { useEffect, useRef, Suspense } from 'react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import {
    Canvas,
    useLoader,
    useThree,
} from '@react-three/fiber'
import { OrbitControls, Bounds } from '@react-three/drei'
import { BoxGeometry } from 'three'


export function Model({ file }: StlViewerProps) {
    const geom = useLoader(STLLoader, file)

    return (
        <>
            <Bounds fit clip observe>
                <mesh rotation={[ -Math.PI * 0.33, 0, 0 ]}>
                    <primitive object={geom} attach="geometry" />
                    <meshPhongMaterial color={0xdc00ad} specular={100} shininess={20} />
                </mesh>
            </Bounds>
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 0, 10]} />
        </>
    )
}


export interface StlViewerProps {
    file: string;
}

export default function StlViewer({ file }: StlViewerProps) {
    return (
        <div style={{aspectRatio: '3/2'}}>
            <Canvas orthographic shadows>
                <Suspense fallback={null}>
                    <Model file={file} />
                </Suspense>
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={true}
                />
            </Canvas>
        </div>
    )
}
