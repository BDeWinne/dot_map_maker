const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (env = {}) => {
  const demoBuild = !!env.demo;

  return {
    entry: "./src/boot.ts",

    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
      publicPath: "auto",
    },

    resolve: {
      extensions: [".ts", ".js"],
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },

    plugins: [
      new webpack.DefinePlugin({
        __DEMO_BUILD__: JSON.stringify(demoBuild),
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
        inject: "body",
        scriptLoading: "defer",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "test-presets", to: "test-presets" },
          { from: "assets", to: "assets" },
        ],
      }),
    ],

    devServer: {
      static: [
        { directory: path.resolve(__dirname, "dist") },
        { directory: path.resolve(__dirname, "test-presets"), publicPath: "/test-presets" },
        { directory: path.resolve(__dirname, "assets"), publicPath: "/assets" },
      ],
      hot: true,
      port: 3000,
    },
  };
};
