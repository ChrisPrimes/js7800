const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const fs = require('fs');

const umd = {
  entry: {
    "js7800.min": "./src/js/index.js"
  },
  devtool: "source-map",
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'js7800',
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
        test: /\.(pal)$/i,
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
    static: { directory: path.join(__dirname, 'site/deploy') },
    devMiddleware: { publicPath: '/js/' },
    compress: true,
    port: 8000
  },  
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
          let src = path.resolve(__dirname, 'dist/js7800.min.js');
          let dst = path.resolve(__dirname, 'site/deploy/js/js7800.min.js');
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

// ES module build for `import` consumers (bundlers and native modules)
const esm = {
  ...umd,
  entry: { "js7800.esm": "./src/js/index.js" },
  experiments: { outputModule: true },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: { type: 'module' }
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ test: /\.esm\.js$/ })]
  },
  devServer: undefined,
  plugins: []
};

module.exports = [umd, esm];
