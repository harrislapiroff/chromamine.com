export default async function(name) {
    const stdlib = await d3.require('https://www.unpkg.com/@observablehq/stdlib@5.8.8/dist/stdlib.js')
    const library = new stdlib.Library()
    try {
        return library[name]()
    } catch(e) {
        console.log(`Failed to load from the Observable stdlib: ${name}`)
    }
}
