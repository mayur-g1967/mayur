'use client';

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SidebarLayout } from "@/app/components/shared/sidebar/sidebar-layout";
import GoogleOAuthWrapper from "../provider/GoogleOAuthProvider";

import { usePathname } from 'next/navigation';

export default function Providers({ children }) {
  const pathname = usePathname();
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isNoSidebarPage = pathname === '/' || authPages.includes(pathname);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="persona-ai-theme"
      enableColorScheme={false}
    >
      <GoogleOAuthWrapper>
        {isNoSidebarPage ? (
          <main className="flex-1 w-full bg-background min-h-screen">
            {children}
          </main>
        ) : (
          <SidebarLayout>{children}</SidebarLayout>
        )}
      </GoogleOAuthWrapper>
    </NextThemesProvider>
  );
}