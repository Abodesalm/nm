export const dynamic = "force-dynamic";

import { Spinner } from "@/components/shared/Spinner";
import { Suspense } from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
