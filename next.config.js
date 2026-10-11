/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Vercel build only; local dev via `npm run dev`
};

export default nextConfig;
