const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    'shade-import': './src/shade-import.js', // Outputs to shade-import.js
    'secret-client': './src/secret-client.js',
    'smart-contract': './src/smart-contract.js',
    wallet: './src/wallet.js',
},
  output: {
    filename: '[name].js', // Output files retain their entry key names
    path: path.resolve(__dirname, 'static/lib'), // Outputs to static/lib
  },
  mode: 'production',
  plugins: [
    new CleanWebpackPlugin(), // Automatically cleans old files in the output directory
  ],
};
