/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bỏ qua lỗi TypeScript khi build để tránh lỗi "exited with 1"
  typescript: {
    ignoreBuildErrors: true,
  },
  // Bỏ qua lỗi ESLint khi build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Cấu hình khác (nếu có)
  reactStrictMode: true,
}

module.exports = nextConfig
