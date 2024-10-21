import type { Metadata } from "next";
import "./app.scss";
import { auth } from "@/app/auth";
import { SignOutButton } from "@/app/components/Auth/SignOutButton";
import { Header } from "@/app/ui";

export const metadata: Metadata = {
  title: "Head Room - De-clutter your mind",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" className="template">
      <body className="template__body">
        <Header>
          {session && (
            <div>
              {`Logged in as ${session.user?.name}`}. <SignOutButton />
            </div>
          )}
        </Header>
        {children}
      </body>
    </html>
  );
}
