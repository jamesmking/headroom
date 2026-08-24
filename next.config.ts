import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the Docker image does not need to
  // ship node_modules. Keeps deployment to Headroom Cloud vendor-neutral.
  output: 'standalone',
  // Both load native/runtime files by path, so they must not be bundled.
  serverExternalPackages: ['node-ical', '@prisma/client'],
  // Do not generate AGENTS.md / CLAUDE.md into the repository.
  agentRules: false,
};

export default nextConfig;
