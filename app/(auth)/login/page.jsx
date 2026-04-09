'use client';

import Link from 'next/link';
import SignInForm from './signin-form';
import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import FloatingLines from '@/app/components/landing/ui/FloatingLines';
import { ChevronRight, LogIn } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        const userInfo = await userInfoResponse.json();

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            googleId: userInfo.sub,
          }),
        });

        const responseData = await res.json();

        if (!res.ok) {
          setError(responseData.message || 'Google login failed');
          toast.error('Google login failed');
          return;
        }

        localStorage.setItem('token', responseData.data);
        if (responseData.user) {
          localStorage.setItem('user', JSON.stringify(responseData.user));
        }

        toast.success('Login successful!');
        router.push('/dashboard');
      } catch (error) {
        console.error('Google login error:', error);
        setError('Failed to login with Google');
        toast.error('Failed to login with Google');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed');
      toast.error('Google login failed');
    },
  });

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden auth-page-enter">
      {/* Background Effect */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <FloatingLines
            lineCount={4}
            strokeWidth={1.5}
            linesGradient={theme === 'light' ? ["#8b5cf6", "#a78bfa", "#7c3aed"] : ["#9067c6", "#df58cd", "#8d86c9", "#a89acd"]}
            animationSpeed={theme === 'light' ? 1 : 1}
            interactive={true}
            bendRadius={theme === 'light' ? 5 : 0.4}
            bendStrength={theme === 'light' ? -0.5 : 4}
            mouseDamping={theme === 'light' ? 0.05 : 0.08}
            parallax={false}
            parallaxStrength={theme === 'light' ? 0.2 : 0.15}
            mixBlendMode="normal"
          />
        </div>
      )}

      <div className="w-full max-w-[1000px] flex rounded-2xl shadow-2xl overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 z-10 transition-all duration-300">
        {/* Left Side - Sign In Form */}
        <div className="flex-[1.2] flex flex-col items-center justify-center px-8 py-12 sm:px-16 auth-form-slide-left relative overflow-hidden">
          <div className="w-full max-w-[380px] space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary/20 shadow-inner">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-foreground font-bold text-3xl sm:text-4xl mb-3 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your dashboard
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={() => googleLogin()}
              disabled={isGoogleLoading}
              className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-background border border-border rounded-xl hover:bg-muted/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group font-medium"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="group-hover:scale-110 transition-transform">
                <path d="M19.8055 10.2292C19.8055 9.55056 19.7495 8.86717 19.6295 8.19788H10.2002V12.0488H15.6014C15.377 13.2911 14.6571 14.3898 13.6106 15.0879V17.5866H16.8248C18.7171 15.8449 19.8055 13.2728 19.8055 10.2292Z" fill="#4285F4" />
                <path d="M10.2002 20.0006C12.9515 20.0006 15.2664 19.1151 16.8294 17.5865L13.6152 15.0879C12.7362 15.6979 11.6044 16.0433 10.2049 16.0433C7.54355 16.0433 5.29065 14.2834 4.51927 11.9169H1.21582V14.4927C2.81488 17.8695 6.35427 20.0006 10.2002 20.0006Z" fill="#34A853" />
                <path d="M4.51459 11.9169C4.09045 10.6746 4.09045 9.33008 4.51459 8.08777V5.51196H1.21582C-0.154209 8.33808 -0.154209 11.6665 1.21582 14.4927L4.51459 11.9169Z" fill="#FBBC04" />
                <path d="M10.2002 3.95805C11.6794 3.936 13.1065 4.47247 14.1856 5.45722L17.0291 2.60289C15.1754 0.904767 12.7318 -0.0292369 10.2002 0.000549919C6.35427 0.000549919 2.81488 2.13165 1.21582 5.51197L4.51459 8.08778C5.28131 5.71655 7.53888 3.95805 10.2002 3.95805Z" fill="#EA4335" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-3 text-muted-foreground bg-card/60 backdrop-blur-md">
                  Or email
                </span>
              </div>
            </div>

            {/* Form */}
            <SignInForm />

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Features/CTA */}
        <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center gradient-persona-primary p-12 text-center text-white relative overflow-hidden auth-form-slide-right">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]"></div>

          <div className="relative z-10 max-w-xs">
            <h2 className="font-bold text-4xl mb-6">PersonaAI</h2>
            <p className="text-white/80 mb-10 text-lg leading-relaxed font-light">
              Your AI-powered companion for personal growth and social mastery.
            </p>

            <div className="space-y-4 mb-10">
              {[
                "Interactive Learning",
                "Confidence Coaching",
                "Social Mentorship"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium bg-white/10 backdrop-blur-md py-2 px-4 rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white"></div>
                  {feature}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-white/60">New to the platform?</p>
              <Link href="/signup" className="group inline-flex items-center gap-2 bg-white text-primary hover:bg-white/90 transition-all py-3.5 px-10 font-bold text-sm rounded-full shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0">
                Create Account
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="lg:hidden fixed bottom-8 w-full text-center px-6">
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}