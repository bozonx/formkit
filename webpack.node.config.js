const merge = require('webpack-merge');

const commonConf = require('./webpack.common.config');


module.exports = merge(commonConf, {
  output: {
    filename: 'formkit.js',
    libraryTarget: 'umd',
  },
});
