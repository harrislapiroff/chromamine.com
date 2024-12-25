import { parseCell } from "@observablehq/parser"
import { Compiler } from "@alex.garcia/unofficial-observablehq-compiler"
import { createHash } from "node:crypto"

const compile = new Compiler();

const hashString = (str) => {
    const hash = createHash("sha256")
    hash.update(str)
    return hash.digest("hex")
}

export async function compileObservable(ojsSource, options) {
    const opts = {
        wrap: true,
        divId: `notebook-${hashString(ojsSource)}`,
        runtimePath: "https://unpkg.com/@observablehq/runtime@5.9.3/dist/runtime.umd.js",
        inspectorPath: "https://unpkg.com/@observablehq/runtime@5.9.3/dist/runtime.umd.js",
        globalPath: null,
        runtimeImportName: "Runtime",
        inspectorImportName: "Inspector",
        // TODO: Allow specification of a list of cells to render?
        ...options,
    }

    // TODO: Allow local imports only
    // this will require adding passthrough copies of every npm
    // package we want to use into eleventy config though...
    const define = await compile.module(ojsSource)

    if (!opts.wrap) return define

    let importLines = ''
    if (opts.runtimePath === opts.inspectorPath) {
        importLines = `import { ${opts.runtimeImportName}, ${opts.inspectorImportName} } from "${opts.runtimePath}"`
    } else {
        importLines = `
            import { ${opts.runtimeImportName} } from "${opts.runtimePath}"
            import { ${opts.inspectorImportName} } from "${opts.inspectorPath}"
            ${opts.globalPath ? `import global from "${opts.globalPath}"` : ''}
        `
    }

    return `
        <div id="${opts.divId}"></div>

        <script src="https://cdn.jsdelivr.net/npm/d3-require@1"></script>
        <script type="module">
            ${importLines}

            ${define}

            const notebookDiv = document.getElementById("${opts.divId}")
            const runtime = new Runtime({}, global)
            const main = runtime.module(define, name => {
                const el = document.createElement("div")
                notebookDiv.appendChild(el)
                return new ${opts.inspectorImportName}(el)
            })
        </script>
    `

}
