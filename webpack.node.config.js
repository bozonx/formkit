const path = require('path');
const webpack = require('webpack');


module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'formkit-node.js',
    library: 'FormKit',
    libraryTarget: 'commonjs',
  },
  cache: false,
  plugins: [
    new webpack.LoaderOptionsPlugin({
      // options: { context: __dirname },
      minimize: false,
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
