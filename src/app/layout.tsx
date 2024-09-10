import type { Metadata } from "next";
import "./app.scss";


export const metadata: Metadata = {
  title: "Head Room",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
