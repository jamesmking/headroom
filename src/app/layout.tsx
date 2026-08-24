import type {Metadata, Viewport} from 'next';
import {IBM_Plex_Mono, IBM_Plex_Sans} from 'next/font/google';
import '@/styles/app.scss';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {default: 'Headroom', template: '%s · Headroom'},
  description: 'A personal daily command centre for working across several teams.',
  robots: {index: false, follow: false},
};

export const viewport: Viewport = {
  themeColor: '#131a21',
};

const RootLayout = ({children}: Readonly<{children: React.ReactNode}>) => (
  <html lang="en-GB" className={`${sans.variable} ${mono.variable}`}>
    <body>
      <div className="root">{children}</div>
    </body>
  </html>
);

export default RootLayout;
