import React from 'react'

export interface SwitchProps {
    status?: boolean,
    width?: number,
    height?: number,
    style?: React.CSSProperties,
    onToggle?: (status: boolean) => void,
}

export interface LabeledSwitchProps extends SwitchProps {
    /** First label will produce a true value, second will produce false */
    labels: [string, string],
}

export default function Switch({
    status = true,
    width = 24,
    height = 16,
    onToggle = () => {},
} : SwitchProps) {
    const clickHandler = () => onToggle(!status)
    const radius = (height - 4) / 2
    return <svg
        width={width}
        height={height}
        className='toggle-switch'
        viewBox={[0, 0, width, height].join(" ")}
        onClick={clickHandler}
    >
        <rect
            x={0.5}
            y={0.5}
            width={width - 1}
            height={height - 1}
            rx={(height - 1.5) / 2}
            stroke="var(--color-base)"
            fill="none"
        />
        <circle
            r = {radius}
            cx = {status ? 2 + radius :  width - 2 - radius}
            cy = {height / 2}
            fill="var(--color-base)"
            stroke="none"
        />
    </svg>
}

export function LabeledSwitch({
    labels = ["On", "Off"],
    onToggle = () => {},
    ...props
} : LabeledSwitchProps) {
    return <div className="labeled-switch">
        <button
            className={[
                'labeled-switch__label',
                props.status && 'labeled-switch__label--active'
            ].join(' ')}
            onClick={() => onToggle(true)}
        >
            {labels[0]}
        </button>
        <Switch {...props} onToggle={onToggle} />
        <button
            className={[
                'labeled-switch__label',
                !props.status && 'labeled-switch__label--active'
            ].join(' ')}
            onClick={() => onToggle(false)}
        >
            {labels[1]}
        </button>
    </div>
}
