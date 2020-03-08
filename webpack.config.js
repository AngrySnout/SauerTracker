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

module.exports = [serverConfig];
