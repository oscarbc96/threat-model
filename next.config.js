/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  basePath: '/threat-model',
  assetPrefix: '/threat-model/', // assetPrefix requires the trailing slash
}

module.exports = nextConfig
