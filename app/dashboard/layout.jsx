'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearAuth } from '@/lib/auth-client';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [authenticated, setIsAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in AND token is not expired
    if (!isAuthenticated()) {
      // Token is either missing, invalid, or expired. 
      // isAuthenticated() automatically securely clears it if it was expired.
      router.push('/');
    } else {
      // Token exists and is valid
      setIsAuthenticatedState(true);
    }

    setIsLoading(false);
  }, [router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}