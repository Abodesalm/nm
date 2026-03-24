import { Spinner } from "@/components/shared/Spinner";
import { Suspense } from "react";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
