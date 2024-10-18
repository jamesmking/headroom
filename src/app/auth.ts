import NextAuth, { type DefaultSession } from "next-auth";
import Google from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, accounts } from "@/app/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.id = account.id;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
});
