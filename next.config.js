/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // permite acabar el build aunque haya errores ESLint
      ignoreDuringBuilds: true,
    },
    typescript: {
      // permite acabar el build aunque haya errores TS
      ignoreBuildErrors: true,
    },
  };
  
  module.exports = nextConfig;  