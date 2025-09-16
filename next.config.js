/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    console.log('BACKEND_URL from environment:', process.env.BACKEND_URL);
    console.log('Using backend URL:', backendUrl);
    
    return [
      {
        source: "/api/chat",
        destination: `${backendUrl}/api/chat`,
      },
      {
        source: "/api/data-extraction",
        destination: `${backendUrl}/api/data-extraction`,
      },
      {
        source: "/api/admin/user-data",
        destination: `${backendUrl}/api/admin/user-data`,
      },
      {
        source: "/api/admin/stats",
        destination: `${backendUrl}/api/admin/stats`,
      },
      {
        source: "/api/admin/feedback",
        destination: `${backendUrl}/api/admin/feedback`,
      },
      {
        source: "/api/admin/sessions",
        destination: `${backendUrl}/api/admin/sessions`,
      },
      {
        source: "/api/sessions/:path*",
        destination: `${backendUrl}/api/sessions/:path*`,
      },
      {
        source: "/api/feedback",
        destination: `${backendUrl}/api/feedback`,
      },
      {
        source: "/api/messages/:path*",
        destination: `${backendUrl}/api/messages/:path*`,
      },
      {
        source: "/api/health",
        destination: `${backendUrl}/api/health`,
      },
    ];
  },
};

module.exports = nextConfig;
