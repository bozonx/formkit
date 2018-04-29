const path = require('path');


module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'Formkit',
    sourceMapFilename: '[file].map',
  },
  cache: false,
};
