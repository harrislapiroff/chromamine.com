const imageGrid = require('./imageGrid')

module.exports = [
    ['paired', 'imagegrid', imageGrid],
    ['single', 'stl', require('./stl')],
]