import type { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.DATABASE_URL!);

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 900
      }
    }
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        // @ts-expect-error - User type is not defined in the session
        session.user.id = token.sub!;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    redirect: async ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect errors to signin page
  },
  debug: process.env.NODE_ENV === "development",
  events: {
    signIn: async (message) => {
      console.log("Sign in event:", message);
    },
    signOut: async (message) => {
      console.log("Sign out event:", message);
    },
    createUser: async (message) => {
      console.log("Create user event:", message);
    },
    linkAccount: async (message) => {
      console.log("Link account event:", message);
    },
    session: async (message) => {
      console.log("Session event:", message);
    },
  },
};
