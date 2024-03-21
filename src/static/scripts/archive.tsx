import React from 'react'
import { createRoot } from 'react-dom/client'

// Scripts for the archive page
import TagBrowser from './components/TagBrowser';

function initTagBrowser() {
    document.querySelectorAll('.js-tag-browser').forEach((el) => {
        const tags = JSON.parse(el.getAttribute('data-tags'))
        const root = createRoot(el)
        root.render(<TagBrowser tags={tags} />)
    })
}

document.addEventListener('DOMContentLoaded', initTagBrowser)
