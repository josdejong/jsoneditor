const webpack = require('webpack')

const minifyPlugin = new webpack.optimize.UglifyJsPlugin({ sourceMap: true })

const productionEnvPlugin = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production')
  }
})

module.exports = {
  entry: './src/jsoneditor/index.vanilla.js',
  devtool: 'source-map',
  cache: true,
  bail: true,
  output: {
    library: 'jsoneditor',
    libraryTarget: 'umd',
    filename: 'dist/jsoneditor.js'
  },
  plugins: [
    // bannerPlugin,
    productionEnvPlugin,
    minifyPlugin
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader'}
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.svg/,
        use: {
          loader: 'svg-url-loader',
          options: {}
        }
      }
    ]
  },
  // using preact saves in the order of 25 kB
  resolve: {
    'alias': {
      'react': 'preact-compat',
      'react-dom': 'preact-compat'
    }
  }
}