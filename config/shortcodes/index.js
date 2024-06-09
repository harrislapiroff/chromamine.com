const imageGrid = require('./imageGrid')
const button = require('./button')

module.exports = [
    ['paired', 'imagegrid', imageGrid],
    ['single', 'stl', require('./stl')],
    ['single', 'dancecard', require('./danceCard')],
    ['single', 'button', button],
]
