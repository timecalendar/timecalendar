/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {
    mainApiUrl: process.env.MAIN_API_URL,
  },
  output: "standalone",
}

module.exports = nextConfig
