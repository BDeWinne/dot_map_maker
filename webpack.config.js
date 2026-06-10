const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/boot.ts",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true
  },

  resolve: {
    extensions: [".ts", ".js"]
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
      inject: "body",
      scriptLoading: "defer",
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "test-presets", to: "test-presets" }],
    }),
  ],

  devServer: {
    static: [
      { directory: path.resolve(__dirname, "dist") },
      { directory: path.resolve(__dirname, "test-presets"), publicPath: "/test-presets" },
    ],
    hot: true,
    port: 3000,
  },
};