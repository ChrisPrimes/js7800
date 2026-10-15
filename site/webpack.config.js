const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const fs = require('fs');

module.exports = {
  entry: {
    "site.min": "./site/src/js/site.js"
  },
  devtool: "source-map",
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'site',
      type: 'umd',
      umdNamedDefine: true
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(rom)$/i,
        type: 'asset/inline',
        generator: { dataUrl: { mimetype: 'application/octet-stream' } },
      },
      {
        test: /\.(png|jp(e*)g|svg|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 8192 } // Inline images < 8kb as base64
        },
        generator: {
          filename: 'images/[hash]-[name][ext]'
        }
      }
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.min\.js$/
      }),
    ]
  },
  devServer: {
    static: { directory: path.join(__dirname, 'deploy') },
    devMiddleware: { publicPath: '/js/' },
    compress: true,
    port: 8000
  },
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
          let src = path.resolve(__dirname, 'dist/site.min.js');
          let dst = path.resolve(__dirname, 'deploy/js/site.min.js');
          fs.copyFile(src, dst,
            err => {
              if (!err) {
                console.log("Copied to site: " + src);
              } else {
                throw "Failed copy to site: " + src
              }
            });
        });
      }
    }
  ]
};
