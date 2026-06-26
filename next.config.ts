import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/js/data/**/*.afm"],
  },
};

export default nextConfig;
