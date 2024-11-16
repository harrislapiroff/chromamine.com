const errorBoundary = (fn, msg) => {
    // Return a new function that wraps our original function in
    // a try...catch block
    return async function (...args) {
        try {
            return await fn.call(this, ...args)
        } catch (err) {
            return `
                <div style="color: red; border: 1px solid red; padding: 1em;">
                    ${msg ? msg : `Error processing template tag`}: ${err}
                </div>
            `
        }
    }
}

module.exports = { errorBoundary }
