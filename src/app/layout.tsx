import '@/styles/app.scss';
import clsx from 'clsx';
import type {Metadata} from 'next';
import {Geist} from 'next/font/google';
import {Footer} from '@/components/footer';
import {Header} from '@/components/header';
import styles from './layout.module.scss';

export const metadata: Metadata = {
  title: 'Headroom',
};

const geist = Geist({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx(styles.html, geist.className)} suppressHydrationWarning={true}>
      <body>
        <div className="root">
          <Header />
          <main className={styles.Main}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
