import React, { Suspense, useState } from 'react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import {
    Canvas,
    useLoader,
    useThree,
} from '@react-three/fiber'
import { OrbitControls, Bounds, Wireframe } from '@react-three/drei'
import { BoxGeometry } from 'three'


export interface ModelProps {
    file: string,
}


export function Model({ file }: ModelProps) {
    const geom = useLoader(STLLoader, file)

    return (
        <>
            <Bounds fit clip observe>
                <mesh rotation={[ -Math.PI * 0.33, 0, 0 ]}>
                    <primitive object={geom} attach="geometry" />
                    <meshPhongMaterial color={0xdc00ad} specular={100} shininess={80} />
                </mesh>
            </Bounds>
            <ambientLight intensity={0.75} />
            <directionalLight position={[0, 0, 10]} />
        </>
    )
}


export interface StlViewerProps {
    file: string
    alt: string
}

export default function StlViewer({ file, alt }: StlViewerProps) {
    const [paused, setPaused] = useState()

    return (
        <figure className="stl-viewer" style={{aspectRatio: '3/2'}} aria-label={`3D model: ${alt}`}>
            <Canvas
                orthographic
                dpr={window.devicePixelRatio}
                resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
            >
                <Suspense fallback={null}>
                    <Model file={file} />
                </Suspense>
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={!paused}
                />
            </Canvas>
            <div className="stl-viewer__actions">
                <button
                    onClick={() => setPaused(!paused)}
                    aria-label={paused ? 'Play' : 'Pause'}
                    className="stl-viewer__action"
                >
                    {paused ? ' ⏵' : '⏸'}
                </button>
                <a
                    href={file}
                    download
                    className="stl-viewer__action"
                    aria-label="Download"
                >
                    ↓
                </a>
            </div>
        </figure>
    )
}
