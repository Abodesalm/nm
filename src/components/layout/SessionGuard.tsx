"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export function SessionGuard() {
  const { data: session, status } = useSession();
  const checking = useRef(false);

  async function checkSession() {
    if (checking.current) return;
    checking.current = true;

    try {
      const user = session?.user as any;
      if (!user?.id || user?.isSuperAdmin) {
        checking.current = false;
        return;
      }

      const res = await fetch(
        `/api/auth/check-session?userId=${user.id}&sessionId=${user.sessionId}`,
        { cache: "no-store" },
      );
      const data = await res.json();

      if (!data.valid) {
        await signOut({ callbackUrl: "/login?reason=forced" });
        return;
      }
    } catch (e) {
      // Don't log out if check fails
    }

    checking.current = false;
  }

  useEffect(() => {
    if (status !== "authenticated") return;

    checkSession();
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [status, session]);

  return null;
}
