const webpack = require('webpack');
const merge = require('webpack-merge');

const commonConf = require('./webpack.common.config');


module.exports = merge(commonConf, {
  output: {
    filename: 'formkit-web.js',
    libraryTarget: 'window',
  },
  devtool: 'source-map',
  plugins: [
    new webpack.LoaderOptionsPlugin({ minimize: false }),
  ],
});
