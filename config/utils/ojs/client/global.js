export default async function(name) {
    const stdlib = await d3.require('https://www.unpkg.com/@observablehq/stdlib@5.8.8/dist/stdlib.js')
    const library = new stdlib.Library()
    console.log(library)
    try {
        // If it's a function, we call it to load the module
        if (typeof library[name] === 'function') return library[name]()
        // Otherwise we return it as is
        // See: https://github.com/observablehq/stdlib/blob/main/src/library.js#L74-L76
        return library[name]
    } catch(e) {
        console.log(`Failed to load from the Observable stdlib: ${name}`)
    }
}
