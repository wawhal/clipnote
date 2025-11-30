const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/index': './src/background/index.ts',
    'content/textCapture': './src/content/textCapture.ts',
    'content/toast': './src/content/toast.ts',
    'content/screenshotOverlay': './src/content/screenshotOverlay.ts',
    'content/hotkeyListener': './src/content/hotkeyListener.ts',
    'offscreen/ocr': './src/offscreen/ocr.ts',
    'ui/popup': './src/ui/popup.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      'fs': false,
      'path': false
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/ui/popup.html', to: 'src/ui/popup.html' },
        { from: 'src/ui/styles.css', to: 'src/ui/styles.css' },
        { from: 'src/offscreen/ocr.html', to: 'src/offscreen/ocr.html' },
        { 
          from: 'icons',
          to: 'icons',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    minimize: false // Keep readable for debugging
  }
};
