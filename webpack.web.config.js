const path = require('path');
const webpack = require('webpack');


module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'formkit-web.js',
    library: 'FormKit',
    // libraryTarget: 'var',
    libraryTarget: 'window',
    sourceMapFilename: '[file].map',
  },
  // devtool: 'cheap-eval-source-map',
  devtool: 'source-map',
  cache: false,
  plugins: [
    new webpack.LoaderOptionsPlugin({
      // options: { context: __dirname },
      minimize: true,
    }),
  ],

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
