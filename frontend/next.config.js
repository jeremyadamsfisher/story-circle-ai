/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    DOMAIN: process.env.DOMAIN,
    CLIENT_ID: process.env.CLIENT_ID,
    AUDIENCE: process.env.AUDIENCE,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

module.exports = nextConfig
