let path = require('path')

module.exports = {
  entry: "./index.ts",
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.png', '.jpg', '.gif', '.svg'],
    alias: {
      crypto: path.resolve(__dirname, 'src', 'shims', 'crypto'),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.(ico|svg|png|jpg|gif)$/,
        use: ['arraybuffer-loader', 'image-webpack-loader']
      }
    ]
  }
}