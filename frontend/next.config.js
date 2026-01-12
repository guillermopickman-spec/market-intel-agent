/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    // Disable Next.js telemetry to prevent build hangs
    // This can also be set as an environment variable: NEXT_TELEMETRY_DISABLED=1
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
  },
}

module.exports = nextConfig
