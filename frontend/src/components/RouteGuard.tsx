"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "./AuthGuard";

const protectedPaths = [
  "/dashboard",
  "/portfolios",
  "/baskets",
  "/alerts",
  "/reports",
  "/profile",
  "/settings",
];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return <>{children}</>;
}
