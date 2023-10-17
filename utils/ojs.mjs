import { parseCell } from "@observablehq/parser"
import { Compiler } from "@alex.garcia/unofficial-observablehq-compiler"

const compile = new Compiler();

export async function compileObservable(ojsSource, options) {
    const opts = {
        wrap: true,
        divId: "notebook",
        runtimePath: "https://unpkg.com/@observablehq/runtime@5.9.3/dist/runtime.umd.js",
        // TODO: Allow the definition of a custom inspector
        // TODO: Allow specification of a list of cells to render?
        ...options,
    }
    const lines = ojsSource.split("\n").filter(l => l.trim() !== "")
    const cells = lines.map(parseCell)
    // TODO: Allow local imports only
    // this will require adding passthrough copies of every npm
    // package we want to use into eleventy config though...
    const define = await compile.module(ojsSource)

    if (!wrap) return define

    return `
        <div id="${opts.divId}"></div>
        <script type="module">
            import { Runtime } from "${opts.runtimePath}"

            ${define}

            const notebookDiv = document.getElementById("${opts.divId}")
            const runtime = new Runtime()
            const main = runtime.module(define, name => {
                const el = document.createElement("div")
                notebookDiv.appendChild(el)
                return {
                    pending() {
                        el.textContent = "Loading…"
                    },
                    rejected(error) {
                        el.textContent = "Error: " + error.message
                    },
                    fulfilled(value) {
                        // Only render the result if it's a DOM node
                        el.textContent = ""
                        if (value instanceof Node) el.appendChild(value)
                    }
                }
            })
        </script>
    `

}
