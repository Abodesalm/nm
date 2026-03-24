import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isSuperAdmin: boolean;
      sessionId: string;
      permissions: {
        section: string;
        permission: "none" | "readonly" | "full";
      }[];
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    isSuperAdmin: boolean;
    sessionId: string;
    permissions: {
      section: string;
      permission: "none" | "readonly" | "full";
    }[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    isSuperAdmin: boolean;
    sessionId: string;
    permissions: {
      section: string;
      permission: "none" | "readonly" | "full";
    }[];
  }
}
