import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pas de basePath : l'app est servie directement à la racine de webgpu.rayroud.com
  // (l'ancien basePath "/dev" cassait tous les liens : /dev/prompt-machine -> 404)
};

export default nextConfig;
