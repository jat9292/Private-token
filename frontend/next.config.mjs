/** @type {import('next').NextConfig} */

import path from "path";
import WasmPackPlugin from "@wasm-tool/wasm-pack-plugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
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
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // options.experimental.esmExternals = "loose";
    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
};
export default nextConfig;
