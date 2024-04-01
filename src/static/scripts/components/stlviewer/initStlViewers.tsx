import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StlViewer from './StlViewer'

export default function initStlViewers() {
    const stlViewers = document.querySelectorAll('.js-stl-viewer')
    stlViewers.forEach((stlViewer) => {
        const stlPath = stlViewer.dataset.src
        const alt = stlViewer.dataset.alt
        const root = createRoot(stlViewer)
        root.render(
            <StrictMode>
                <StlViewer file={stlPath} alt={alt} />
            </StrictMode>
        )
    })
}
