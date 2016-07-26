var webpack = require('webpack')
var path = require('path')
var nodeExternals = require('webpack-node-externals')

module.exports = {
  devtool: 'source-map',
  target: 'node',
  externals: [nodeExternals()],
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'build.js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compressor: {
        warnings: false
      }
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: [path.resolve(__dirname, './src')],
      exclude: /node_modules/
    },{
      test: /\.json$/,
      loaders: ['json']
    }]
  }
}