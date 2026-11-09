const nextConfig = {
  reactStrictMode: true,
  // PGlite ships a WASM build — keep it out of the server bundle (demo mode only)
  serverExternalPackages: ['@electric-sql/pglite'],
  // allow the sandboxed preview host to load dev assets
  allowedDevOrigins: ['*', '*.e2b.app'],
  experimental: { serverActions: { bodySizeLimit: '2mb' } }
};
export default nextConfig;
