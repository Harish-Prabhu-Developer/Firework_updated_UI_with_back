const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const compileNodeModules = [
    path.resolve(__dirname, 'node_modules/@react-native/new-app-screen'),
    path.resolve(__dirname, 'node_modules/react-native-safe-area-context'),
    path.resolve(__dirname, 'node_modules/react-native-css-interop'),
    path.resolve(__dirname, 'node_modules/nativewind'),
    path.resolve(__dirname, 'node_modules/react-native-chart-kit'),
    path.resolve(__dirname, 'node_modules/react-native-svg'),
    path.resolve(__dirname, 'node_modules/react-native-camera-kit'),
];

const babelLoaderConfiguration = {
    test: /\.(js|jsx|ts|tsx)$/,
    // Add every directory that needs to be compiled by Babel during the build.
    include: [
        path.resolve(__dirname, 'index.js'),
        path.resolve(__dirname, 'App.tsx'),
        path.resolve(__dirname, 'src'),
        ...compileNodeModules,
    ],
    use: {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            // The 'module:@react-native/babel-preset' preset includes JSX and flow support.
            presets: ['module:@react-native/babel-preset'],
            plugins: ['react-native-web'],
        },
    },
};

const imageLoaderConfiguration = {
    test: /\.(gif|jpe?g|png|svg)$/,
    type: 'asset/resource',
};

const cssLoaderConfiguration = {
    test: /\.css$/i,
    use: ['style-loader', 'css-loader', 'postcss-loader'],
};

module.exports = {
    entry: [path.resolve(__dirname, 'index.js')],
    output: {
        filename: '[name].bundle.web.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    module: {
        rules: [
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false,
                },
            },
            babelLoaderConfiguration,
            imageLoaderConfiguration,
            cssLoaderConfiguration,
        ],
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html'),
        }),
        new webpack.DefinePlugin({
            __DEV__: JSON.stringify(true),
        }),
    ],
    resolve: {
        alias: {
            'react-native/Libraries/Core/Devtools/openURLInBrowser': path.resolve(__dirname, 'src/shims/openURLInBrowser.js'),
            'react-native/Libraries/Core/ReactNativeVersion': path.resolve(__dirname, 'src/shims/ReactNativeVersion.js'),
            'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
            '@react-native-documents/picker': path.resolve(__dirname, 'src/shims/react-native-documents-picker.web.js'),
            'react-native-html-to-pdf': path.resolve(__dirname, 'src/shims/native-modules.web.js'),
            'react-native-print': path.resolve(__dirname, 'src/shims/native-modules.web.js'),
            'react-native-blob-util': path.resolve(__dirname, 'src/shims/native-modules.web.js'),
            'react-native-camera-kit': path.resolve(__dirname, 'src/shims/native-modules.web.js'),
        },
        extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
    },
    devServer: {
        historyApiFallback: true,
        static: {
            directory: path.join(__dirname, 'public'),
        },
        hot: true,
        port: 5000,
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    performance: {
        maxAssetSize: 5120000,
        maxEntrypointSize: 5120000,
    },
};
