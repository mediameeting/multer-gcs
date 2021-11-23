const path = require('path')

module.exports = file => path.resolve(
  __dirname,
  'files',
  file
)
