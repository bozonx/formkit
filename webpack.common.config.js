const path = require('path');


module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'FormKit',
    sourceMapFilename: '[file].map',
  },
  cache: false,
  // module: {
  //   rules: [
  //     {
  //       test: /\.js$/,
  //       exclude: /node_modules/,
  //     },
  //     // {
  //     //   test: /\.jsx?$/,
  //     //   use: 'babel-loader',
  //     //   exclude: /node_modules/,
  //     // },
  //   ],
  // },
};
