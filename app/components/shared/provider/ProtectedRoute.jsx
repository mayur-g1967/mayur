'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check for token in localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            // If not logged in, redirect to landing page
            router.push('/');
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Show loading spinner while checking auth state
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#934CF0] mx-auto mb-4" style={{ borderBottomColor: 'transparent' }}></div>
                    <p className="text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Render the required component if authenticated
    return <>{children}</>;
}
