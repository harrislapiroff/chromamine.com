import React from 'react'

import { LabeledSwitch } from './Switch'

export interface TagSortSwitchProps {
    sort: string,
    onChange: (sort: string) => void,
}

export default function TagSortSwitch({ sort = 'usage', onChange = () => {} }: TagSortSwitchProps) {
    return <>
        <LabeledSwitch
            labels={['Most Used', 'Alphabetical']}
            status={sort === 'usage'}
            style={{ height: 'var(--font-size-base)', width: '3ch', verticalAlign: '-0.1em' }}
            onToggle={(status) => onChange(status ? 'usage' : 'alphabetical')}
        />
    </>
}
