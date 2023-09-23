/** @type {import('next').NextConfig} */

import path from "path";
import WasmPackPlugin from "@wasm-tool/wasm-pack-plugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  // permits loading of the worker file (barretenberg.js):
  experimental: {
    esmExternals: 'loose',
  },
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
  // allows for local running of multithreads:
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;