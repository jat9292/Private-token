import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Private Token",
  description: "Homomorphic, zk-SNARK private token",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
