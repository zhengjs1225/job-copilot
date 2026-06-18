import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署在子路径 /job-copilot/
  basePath: '/job-copilot',
  assetPrefix: '/job-copilot',
}

export default nextConfig
