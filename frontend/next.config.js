/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    DOMAIN: process.env.DOMAIN,
    CLIENT_ID: process.env.CLIENT_ID,
    AUDIENCE: process.env.AUDIENCE,
  },
};

module.exports = nextConfig
