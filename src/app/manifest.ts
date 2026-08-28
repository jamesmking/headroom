import type {MetadataRoute} from 'next';

/**
 * Web app manifest, so Headroom installs to a phone home screen as itself
 * rather than as a browser bookmark with a shrunken favicon.
 *
 * `standalone` drops the browser chrome, which is the point: the day view is
 * the whole screen, and the address bar is one more row of pixels competing
 * with the timeline. The colours match the sign-in screen, so the splash and
 * status bar are continuous with the first thing the application draws.
 */
const manifest = (): MetadataRoute.Manifest => ({
  name: 'Headroom',
  short_name: 'Headroom',
  description: 'A personal daily command centre for working across several teams at once.',
  start_url: '/',
  display: 'standalone',
  background_color: '#131a21',
  theme_color: '#131a21',
  icons: [
    {src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
    {src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
    // Drawn smaller, because a launcher may crop this to a circle and only the
    // middle 80% is guaranteed to survive.
    {src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
  ],
});

export default manifest;
