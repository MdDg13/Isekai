/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to support dynamic routes
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
export default nextConfig;
