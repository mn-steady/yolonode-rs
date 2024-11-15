const path = require('path');

module.exports = {
  entry: './src/shade-import.js', // This will import both shade.js and secret.js
  output: {
    filename: 'shade.bundle.js',
    path: path.resolve(__dirname, 'static/lib/shade'),
  },
  mode: 'production',
};
