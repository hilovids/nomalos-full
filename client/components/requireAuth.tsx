'use client';
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow access to home and login pages without auth
    if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/about") || pathname.startsWith("/rules") || pathname.startsWith("/privacy") || pathname.startsWith("/api/docs")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
    }
  }, [router, pathname]);

  return <>{children}</>;
}