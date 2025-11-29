const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/index': './src/background/index.ts',
    'content/textCapture': './src/content/textCapture.ts',
    'ui/popup': './src/ui/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/ui/popup.html', to: 'src/ui/popup.html' },
        { from: 'src/ui/styles.css', to: 'src/ui/styles.css' },
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
