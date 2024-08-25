const imageGrid = require('./imageGrid')
const button = require('./button')
const image = require('./image')

module.exports = [
    ['paired', 'imagegrid', imageGrid],
    ['single', 'stl', require('./stl')],
    ['single', 'dancecard', require('./danceCard')],
    ['single', 'button', button],
    ['single', 'image', image],
]
