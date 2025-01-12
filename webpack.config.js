const path = require('path');

module.exports = {
    entry: {
        stride: './src/stride-import.js',
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
};
