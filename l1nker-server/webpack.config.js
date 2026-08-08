const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  target: 'webworker',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
  },
   externals: {
        'mock-aws-s3': 'mock-aws-s3',
        'aws-sdk': 'aws-sdk',
        'nock': 'nock',
        'cloudflare:workers': 'commonjs2 cloudflare:workers'
    }
};
