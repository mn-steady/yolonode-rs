// webpack.config.js
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        stride: './src/stride-import.js',
        shade: './src/shade-import.js',
        secret: './src/secret-import.js', 
    },
    output: {
        filename: '[name].bundle.js', 
        path: path.resolve(__dirname, 'static/lib'),
    },
    mode: 'production',
    resolve: {
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            vm: require.resolve('vm-browserify'),
        },
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
};
