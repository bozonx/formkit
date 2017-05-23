const webpack = require('webpack');
const merge = require('webpack-merge');

const commonConf = require('./webpack.common.config');

module.exports = merge(commonConf, {
  output: {
    filename: 'formkit.js',
    libraryTarget: 'commonjs2',
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({ minimize: false }),
  ],
});
