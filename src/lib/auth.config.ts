import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { UsuarioAuth } from "./definitions";
import { authenticateCredentials } from "@/lib/user-auth";

declare module "next-auth" {
  interface Session {
    user: UsuarioAuth;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: UsuarioAuth;
    rol_id?: number;
    id?: string;
    username?: string;
    email?: string;
  }
}

async function jwtCallback({
  token,
  user,
}: {
  token: JWT;
  user?: UsuarioAuth | User;
}): Promise<JWT> {
  if (user && "username" in user) {
    const u = user as UsuarioAuth;

    token.user = u;
    token.rol_id = u.rol_id;
    token.id = u.id;
    token.username = u.username;
    token.email = u.email;
  }
  return token;
}

async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> {
  if (token.user) {
    session.user = token.user;
  }
  return session;
}

export const authConfig: AuthOptions = {
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        return authenticateCredentials(credentials.username, credentials.password);
      },
    }),
  ],
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
