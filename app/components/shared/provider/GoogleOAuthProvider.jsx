'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import '../../../globals.css';

export default function GoogleOAuthWrapper({ children }) {
  return (
        <GoogleOAuthProvider 
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          onScriptLoadError={() => console.error('Failed to load Google script')}
          onScriptLoadSuccess={() => console.log('Google script loaded successfully')}
        >
          {children}
          <Toaster position="top-right" richColors />
        </GoogleOAuthProvider>
  );
}