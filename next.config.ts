import type {NextConfig} from 'next';

// Vercel builds its own serverless output and does not want a standalone
// bundle. Everywhere else — Docker, a plain Node host — standalone is what
// keeps the deployment self-contained and vendor-neutral.
const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  output: isVercel ? undefined : 'standalone',
  // Both load native/runtime files by path, so they must not be bundled.
  serverExternalPackages: ['node-ical', '@prisma/client'],
  // Do not generate AGENTS.md / CLAUDE.md into the repository.
  agentRules: false,
};

export default nextConfig;
