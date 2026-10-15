/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Plain static files: the same `out/` is deployed to Vercel and bundled
  // into the Capacitor app. Security headers live in vercel.json, since a
  // static export ignores `headers()`.
  output: "export",
  transpilePackages: ["@lockkaro/types", "@lockkaro/validation"],
  // Hide the Next.js dev overlay indicator (the floating "N" badge). Prod is
  // unaffected — it only ever renders during `next dev`.
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
