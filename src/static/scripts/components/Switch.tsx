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
    style = {},
    onToggle = () => {},
} : SwitchProps) {
    const clickHandler = () => onToggle(!status)
    const radius = (height - 4) / 2
    return <svg
        width={width}
        height={height}
        style={style}
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
    return <div style={{ cursor: 'pointer', display: 'inline-block' }}>
        <span
            style={{
                paddingRight: '0.5ch',
                color: props.status ? 'var(--color-base)' : 'var(--color-text-muted)',
            }}
            onClick={() => onToggle(true)}
        >
            {labels[0]}
        </span>
        <Switch {...props} onToggle={onToggle} />
        <span
            style={{
                paddingLeft: '0.5ch',
                color: props.status ? 'var(--color-text-muted)' : 'var(--color-base)',
            }}
            onClick={() => onToggle(false)}
        >
            {labels[1]}
        </span>
    </div>
}
