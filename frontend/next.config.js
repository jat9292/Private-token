/** @type {import('next').NextConfig} */
const path = require("path");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
  webpack(config, options) {
    config.plugins.push(
      new WasmPackPlugin({
        crateDirectory: path.resolve(
          __dirname,
          "../circuits/exponential_elgamal/babygiant/pkg"
        ),
      })
    );

    config.experiments = { layers: true, syncWebAssembly: true };

    return config;
  },
};