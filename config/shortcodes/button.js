const button = (label, link, className) => (
    `<a
        href="${link}"
        class="${['button', className ? `button-${className}` : null].join(' ')}"
    >${label}</a>`
)

module.exports = button
