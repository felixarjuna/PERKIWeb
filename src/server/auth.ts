import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { env } from "~/env.mjs";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/lib/db/schema/schema";
import { db } from ".";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    accountsTable: accounts,
    sessionsTable: sessions,
    usersTable: users,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub ?? session.user.id,
      },
    }),
  },
  debug: env.NODE_ENV === "development",
  pages: {
    newUser: "/auth/signup",
    signIn: "/auth/signin",
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      authorize: async (credentials) => {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const user = (
          await db
            .select()
            .from(users)
            .where(eq(users.email, username))
            .limit(1)
        ).at(0);
        if (!user?.hashedPassword) {
          return null;
        }

        const isPasswordMatch = await bcrypt.compare(
          password,
          user.hashedPassword
        );
        if (!isPasswordMatch) {
          return null;
        }

        return {
          email: user.email,
          id: user.id,
          image: user.image,
          name: user.name,
        };
      },
      credentials: {
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
      },
      name: "credentials",
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
