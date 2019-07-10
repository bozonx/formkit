const path = require('path');
const merge = require('webpack-merge');

const commonConf = require('./webpack.common.config');


module.exports = merge(commonConf, {
  output: {
    path: path.resolve(__dirname, 'dist/module'),
    filename: 'index.js',
    libraryTarget: 'umd',
  },
});
