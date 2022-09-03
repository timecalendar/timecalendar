/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {
    mainApiUrl: process.env.MAIN_API_URL,
  },
}

module.exports = nextConfig
