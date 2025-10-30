/** @type {import('next').NextConfig} */
const nextConfig = { 
  // Switch to Node runtime so API routes work on Cloudflare Pages
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
export default nextConfig;
