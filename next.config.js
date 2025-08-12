/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rewrites are handled by vercel.json for production
  rewrites: async () => {
    return process.env.NODE_ENV === "development" 
      ? [
          {
            source: "/api/:path*",
            destination: "http://localhost:8000/api/:path*",
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
