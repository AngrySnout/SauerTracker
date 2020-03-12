const path = require('path');
const glob_entries = require('webpack-glob-entries');

const serverConfig = {
  target: 'node',
  entry: {
    tracker: './src/index.js',
    detectClanwars: './src/scripts/detect-clanwars.js',
    recalculateElo: './src/scripts/recalculate-elo.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  externals: {
    knex: 'commonjs knex',
  },
  module: {
    rules: [{ test: /\.pug$/, use: 'pug-loader' }],
  },
};

const websiteConfig = {
  entry: glob_entries('./website/js/[^_]*.js'),
  output: {
    path: path.resolve(__dirname, 'assets/js'),
    filename: '[name].js',
  },
  module: {
    rules: [{ test: /\.pug/, use: 'pug-loader' }],
    rules: [
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
    ],
  },
};

module.exports = [serverConfig, websiteConfig];
