import React, { useState } from 'react'
import TagSortSwitch from './TagSortSwitch'
import TagList from './TagList'

const SORT_FNS = {
    usage: (a, b) => b.count - a.count,
    alphabetical: (a, b) => a.name.localeCompare(b.name),
}

export default function TagBrowser({ tags }: { tags: Array<TagItem> }) {
    const [sort, setSort] = useState('usage')

    return <section>
        <h2>Tags</h2>
        <div style={{ margin: 'calc(var(--line-height-base) / 2) 0' }}>
            Sort: <TagSortSwitch sort={sort} onChange={s => setSort(s)} />
        </div>
        <TagList tags={tags.toSorted(SORT_FNS[sort])} />
    </section>
}
