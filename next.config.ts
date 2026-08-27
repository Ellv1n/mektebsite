import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Məhsul şəkilləri lokal /public/uploads qovluğundan verilir — xarici host yoxdur.
  images: {
    formats: ["image/webp"],
    // Şəkillər ağ fonda studiya çəkilişidir; bu ölçülər telefon → desktop diapazonunu örtür
    deviceSizes: [360, 420, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 200, 256, 384],
  },
  eslint: {
    // Lint ayrıca işlədilir, build-i bloklamasın
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
