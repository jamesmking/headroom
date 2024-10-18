import type { Metadata } from "next";
import "./app.scss";
import { auth } from "@/app/auth";
import { SignOutButton } from "@/app/components/Auth/SignOutButton";

export const metadata: Metadata = {
  title: "Head Room",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <div className="logoWrap">
          <img src="logo.svg" className="logo" />
        </div>
        {session && (
          <div>
            {`Logged in as ${session.user?.name}`} <SignOutButton />
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
