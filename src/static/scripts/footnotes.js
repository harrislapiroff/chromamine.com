import '@oddbird/popover-polyfill'

import { computePosition, flip, shift } from '@floating-ui/dom'

const positionPopover = (a, popover) => {
    computePosition(a, popover, {
        placement: 'bottom-start',
        middleware: [flip(), shift()],
    }).then(({ x, y }) => {
        Object.assign(popover.style, {
            left: `${x}px`,
            top: `${y}px`,
        })
    })
}

const togglePopover = (a, popover) => {
    a.classList.toggle('footnote-ref--active')
    popover.classList.toggle('footnote-popover--active')
    popover.ariaHidden = !popover.ariaHidden
    if (a.classList.contains('footnote-ref--active')) {
        // Bind a one-time click event on the whole document to hide the popover
        const hidePopover = () => {
            togglePopover(a, popover)
            document.removeEventListener('click', hidePopover)
        }
        a._hidePopoverListener = hidePopover
        document.addEventListener('click', hidePopover)
    } else {
        // When hiding the popover, remove any existing document click listener
        // We need to track the hidePopover function to remove it properly
        if (a._hidePopoverListener) {
            document.removeEventListener('click', a._hidePopoverListener)
            a._hidePopoverListener = null
        }
    }
}

export const initFootnotes = () => {
    // Find all footnotes on the page
    const footnoteLinks = Array.from(document.getElementsByClassName('footnote-ref'))

    footnoteLinks.forEach(a => {
        a.classList.add('footnote-ref--interactive') // Add interactive class to get interactive styles
        a.innerHTML = '' // Remove the number
        a.ariaLabel = 'Show footnote' // Add a label for accessibility

        // Create a popover for each footnote and move the HTML from the footnote into it
        const footnoteTarget = document.getElementById(a.href.split('#')[1])
        const popover = document.createElement('div')
        popover.classList.add('footnote-popover')
        popover.innerHTML = footnoteTarget.innerHTML // Copy HTML over
        popover.id = footnoteTarget.id // Copy ID over
        popover.querySelector('.footnote-backref').remove() // Remove the back link
        document.body.appendChild(popover) // Add the popover to the DOM
        popover.ariaHidden = true // Hide the popover from screenreaders by default

        window.addEventListener('resize', () => positionPopover(a, popover)) // TODO: only reposition visible popovers?

        // Toggle the popover when the footnote link is clicked
        a.addEventListener('click', e => {
            // Position the popover properly (TODO: only do this when activating it?)
            positionPopover(a, popover)
            // Toggle the popover
            togglePopover(a, popover)
            e.preventDefault()
            e.stopPropagation()
        })
    });

    // Remove the footnotes list completely
    const footnotes = Array.from(
        document.getElementsByClassName('footnotes')
    ).forEach(footnotes => footnotes.remove())
}
