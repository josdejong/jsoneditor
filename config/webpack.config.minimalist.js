const webpack = require('webpack')
const config = require('./webpack.config')
const emptyFile = __dirname + '/../src/jsoneditor/utils/empty.js'

const excludeAcePlugin = new webpack.NormalModuleReplacementPlugin(new RegExp('assets\/ace'), emptyFile)
const excludeAjvPlugin = new webpack.NormalModuleReplacementPlugin(new RegExp('^ajv$'), emptyFile)

const configMinimalist = Object.assign({}, config, {
  output: Object.assign({}, config.output, {
    filename: 'dist/jsoneditor-minimalist.js'
  }),

  plugins: [
    excludeAcePlugin,
    excludeAjvPlugin
  ].concat(config.plugins)
})

module.exports = configMinimalist
