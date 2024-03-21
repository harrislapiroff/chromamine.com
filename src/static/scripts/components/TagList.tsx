import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'

import TagSortSwitch from './TagSortSwitch'

interface TagItem {
    name: string;
    count: number;
    url: string;
}

export default function TagList({ tags }: { tags: Array<TagItem> }) {
    const [truncated, setTruncated] = useState(true)

    return <>
        <ul
            className={[
                'archive-list',
                'archive-list--tags',
                truncated && 'archive-list--truncated'
            ].filter(c => !!c).join(' ')}
        >
            {tags.map(
                (tag) => <li key={tag.name} className="archive-list__item">
                    <a href={tag.url} className="archive-list__item-link">
                        <span className="archive-list__item-tag-name">{tag.name}</span>
                        <span className="archive-list__item-tag-count">({tag.count} post{tag.count !== 1 && 's'})</span>
                    </a>
                </li>
            )}
        </ul>
        <button
            className="expand-link"
            onClick={() => setTruncated(!truncated)}
        >{truncated ? '↓ More Tags' : '↑ Fewer Tags'}</button>
    </>
}
