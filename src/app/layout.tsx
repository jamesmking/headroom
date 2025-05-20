import type { Metadata } from "next";
import { Header } from "@/components/header";
import styles from "./layout.module.scss";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Headroom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={styles.html}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
