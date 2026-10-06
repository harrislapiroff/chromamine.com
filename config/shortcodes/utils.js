const renderError = (err, msg) => `
                <div style="color: red; border: 1px solid red; padding: 1em;">
                    ${msg ? msg : `Error processing template tag`}: ${err}
                </div>
            `

export const errorBoundary = (fn, msg) => {
    // Return a new function that wraps our original function in
    // a try...catch block. A synchronous function stays synchronous,
    // so the template engine doesn't have to await a promise for it;
    // only a function that returns a promise gets an async boundary.
    return function (...args) {
        let result
        try {
            result = fn.call(this, ...args)
        } catch (err) {
            return renderError(err, msg)
        }
        if (typeof result?.then === 'function') {
            return result.then(undefined, (err) => renderError(err, msg))
        }
        return result
    }
}
