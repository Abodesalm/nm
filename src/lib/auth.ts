import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";
import mongoose from "mongoose";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          await connectDB();

          const user = await SystemUser.findOne({ email: credentials.email });
          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!isValid) return null;

          const sessionId = new mongoose.Types.ObjectId().toString();
          const userAgent = req?.headers?.["user-agent"] ?? "Unknown device";

          try {
            await SystemUser.findByIdAndUpdate(user._id, {
              lastLogin: new Date(),
              $push: {
                sessions: {
                  _id: new mongoose.Types.ObjectId(sessionId),
                  device: userAgent,
                  browser: userAgent,
                  lastActivity: new Date(),
                  createdAt: new Date(),
                },
              },
            });
          } catch (sessionError) {
            // Don't block login if session save fails
            console.error("Session save error:", sessionError);
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isSuperAdmin: user.isSuperAdmin,
            permissions: user.permissions,
            sessionId,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.permissions = (user as any).permissions;
        token.sessionId = (user as any).sessionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isSuperAdmin = token.isSuperAdmin;
        (session.user as any).permissions = token.permissions;
        (session.user as any).sessionId = token.sessionId;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
