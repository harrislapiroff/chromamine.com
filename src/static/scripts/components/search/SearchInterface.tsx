import React, { useEffect, useState } from 'react'
import { importPagefind } from './pagefind'

export interface SearchInterfaceProps {
    bundlePath: string
}

export default function SearchInterface({ bundlePath }: SearchInterfaceProps) {
    const [pagefind, setPagefind] = useState()
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([] as object[])
    const [pending, setPending] = useState(false)

    useEffect(() => {
        async function loadPagefind() {
            const pagefind = await import(bundlePath + 'pagefind.js')
            setPagefind(pagefind)
        }
        loadPagefind()
    }, [bundlePath])

    useEffect(() => {
        // If the search term is empty, set pending false, clear results, and do nothing else
        if (!searchTerm) {
            setPending(false)
            setSearchResults([])
            return
        }

        // Otherwise, set pending to true and run the search
        setPending(true)
        pagefind.debouncedSearch(searchTerm)
            .then(async search => {
                const searchResults = await Promise.all(search.results.map(r => r.data()))
                setSearchResults(searchResults)
                setPending(false)
            })

        // Cleanup
        return () => { pagefind.destroy() }
    }, [searchTerm])

    return <section>
        <h2>Search</h2>
        <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!pagefind}
        />
        {pending && <p>Searching...</p>}
        {searchResults.length > 0 && (
            <ul className="archive-list">
                {searchResults.map((result, i) => (
                    <li key={i} className="archive-list__item">
                        <a className="archive-list__item-link" href={result.url}>
                            <span className="archive-list__item-title">{result.meta.title}</span>{' '}
                            <span className="archive-list__item-date">{result.meta.date}</span>
                        </a>
                    </li>
                ))}
            </ul>
        )}
    </section>
}
