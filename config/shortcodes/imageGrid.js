const { md } = require('../markdown')

// Should be registered as a paired shortcode
const imageGrid = function (content) {
    // Add page data to the env to match the env that gets
    // passed to markdown during normal rendering
    const env = {
        ...this.eleventy.env,
        page: this.page
    }
    const images = content.split('\n')
        // Remove indentation whitespace
        .map((line) => line.trim())
        // Remove blank lines
        .filter(l => l !== '')
        // Then render remaining lines inline to avoid erroneous paragraph tags
        .map((line) => md.renderInline(line, env))
    return [
        `<div class="image-grid">`,
        ...images.map((img) => `<div class="image-grid__item">${img}</div>`),
        `</div>`
    ].join('')
}

module.exports = imageGrid
