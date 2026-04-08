"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/app/components/shared/sidebar/Sidebar";
import { usePathname } from "next/navigation";

export function SidebarLayout({ children }) {
  const pathname = usePathname();

  // Define routes where sidebar should be hidden
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const shouldHideSidebar = authRoutes.some(route => pathname.startsWith(route));

  // If on auth page, render children without sidebar
  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  // Otherwise, render with sidebar
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="w-full">{children}</main>
      </div>
    </SidebarProvider>
  );
}