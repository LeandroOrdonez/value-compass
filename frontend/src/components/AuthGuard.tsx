"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/signin");
        return;
      }

      try {
        await authService.getCurrentUser();
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        authService.logout();
        router.push("/signin");
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
    // router is a stable reference from Next.js; excluded to avoid re-running auth checks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
