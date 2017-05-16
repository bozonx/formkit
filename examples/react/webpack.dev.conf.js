// Webpack config for development
const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('babel-polyfill');


module.exports = {
  context: path.resolve(__dirname, './'),
  entry: {
    app: [
      'babel-polyfill',
      './src/entrypoint.js',
    ],
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          'babel-loader'
        ],
        //exclude: /node_modules/,
        include: [
          path.resolve(__dirname, './src'),
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              includePaths: [
                path.resolve(__dirname, './src'),
              ],
            },
          },
        ],
        include: [
          path.resolve('src'),
          path.resolve(__dirname, '../'),
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.ejs$/,
        use: 'ejs-loader',
      },
    ],
  },
  plugins: _.compact([
    new HtmlWebpackPlugin({
      template: './src/index.html.ejs',
    }),
    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname,
      },
      debug: true,
    }),
  ]),
  devtool: 'cheap-eval-source-map',
};
