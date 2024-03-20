import React from 'react';
import { hydrateRoot } from 'react-dom/client';

interface TagItem {
    name: string;
    count: number;
    url: string;
}

function TagList({ tags }: { tags: Array<TagItem> }) {
    return <ul className="archive-list archive-list--tags">
        {tags.map(
            (tag) => <li key={tag.name} className="archive-list__item">
                <a href={tag.url} className="archive-list__item-link">
                    <span className="archive-list__item-tag-name">{tag.name}</span>
                    <span className="archive-list__item-tag-count">({tag.count} post{tag.count !== 1 && 's'})</span>
                </a>
            </li>
        )}
    </ul>
}

export const initTagList = function() {
    Array.from(document.getElementsByClassName('js-tag-list')).forEach((tagListEl) => {
        const tags = JSON.parse(tagListEl.dataset.tags)
        const root = hydrateRoot(
            tagListEl,
            <TagList tags={tags} />
        )
    })
}
