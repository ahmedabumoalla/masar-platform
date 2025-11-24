/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "jajuvaijwgfepzrvqzrxx.supabase.co",
      "qzxxfzdpqjfijjwqkmib.supabase.co",
      "supabase.co",
      "supabase.in",
      "supabase.net"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
      {
        protocol: "https",
        hostname: "**.supabase.net",
      }
    ],
  },
};

module.exports = nextConfig;
