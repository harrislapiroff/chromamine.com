// Scripts for the archive page
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import TagBrowser from './components/TagBrowser'
import SearchInterface from './components/search/SearchInterface'

/** Tag Browser */

function initTagBrowser() {
    document.querySelectorAll('.js-tag-browser').forEach((el) => {
        const tags = JSON.parse(el.getAttribute('data-tags'))
        const root = createRoot(el)
        root.render(<StrictMode>
            <TagBrowser tags={tags} />
        </StrictMode>)
    })
}

document.addEventListener('DOMContentLoaded', initTagBrowser)

/** Search */

function initSearch() {
    document.querySelectorAll('.js-search-interface').forEach((el) => {
        const bundlePath = el.getAttribute('data-bundle-path') || '/pagefind/'
        const root = createRoot(el)
        root.render(<StrictMode>
            <SearchInterface bundlePath={bundlePath} />
        </StrictMode>)
    })
}

document.addEventListener('DOMContentLoaded', initSearch)
