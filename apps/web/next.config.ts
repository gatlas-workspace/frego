import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép chạy song song nhiều bản dev (NEXT_DIST_DIR=.next-a next dev -p 3101).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Dùng chung mã nguồn TypeScript của packages/core.
  transpilePackages: ["@frego/core"],
  // Trang quản lý toàn dữ liệu động; chưa bật Cache Components để giữ mô hình render đơn giản.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
