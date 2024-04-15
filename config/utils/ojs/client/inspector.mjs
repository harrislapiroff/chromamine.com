export class Inspector {
    constructor(el) {
        this.el = el
    }

    pending() {
        this.el.textContent = "Loading…"
    }

    rejected(error) {
        this.el.textContent = "Error: " + error.message
    }

    fulfilled(value) {
        // Only render the result if it's a DOM node
        this.el.textContent = ""
        if (value instanceof Node) this.el.appendChild(value)
    }
}
