const path = require('path');


console.log(process.env.NODE_ENV)

module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'Formkit',
    sourceMapFilename: '[file].map',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        //exclude: /node_modules/,
      },
    ],
  },
  cache: false,
  resolve: {
    extensions: ['.js', '.json', '.ts'],
  },
};
