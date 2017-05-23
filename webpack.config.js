const path = require('path');
const webpack = require('webpack');


module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'formkit-node.js',
    library: 'FormKit',
    libraryTarget: 'commonjs',
    // libraryTarget: 'var',
    // libraryTarget: 'window',
    sourceMapFilename: '[file].map',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: { context: __dirname },
      minimize: true,
    }),
  ],
  devtool: 'cheap-eval-source-map',
  cache: false,
};
