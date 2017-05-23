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
        // include: [
        //   // TODO: упростить - см resolve
        //   path.resolve(__dirname, './src'),
        //   // for libs
        //   path.resolve(__dirname, '../common'),
        //   path.resolve(__dirname, '../../shared-lib/app'),
        //   path.resolve(__dirname, '../../shared-lib/web'),
        //   path.resolve(__dirname, '../../mold'),
        //   path.resolve(__dirname, '../../mold-devpanel'),
        // ],
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
  cache: false
};
