'use client';

import Link from 'next/link';
import SignUpForm from './signup-form';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import FloatingLines from '@/app/components/landing/ui/FloatingLines';
import { ChevronRight, UserPlus } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          googleId: decoded.sub,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        setError(responseData.message || 'Google signup failed');
        toast.error('Google signup failed');
        return;
      }

      localStorage.setItem('token', responseData.data);
      if (responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }

      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Failed to signup with Google');
      toast.error('Failed to signup with Google');
    }
  };

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
        {/* Left Side - Log In Prompt */}
        <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center gradient-persona-primary p-12 text-center text-white relative overflow-hidden auth-form-slide-left">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]"></div>

          <div className="relative z-10 max-w-xs">
            <h2 className="font-bold text-4xl mb-6">PersonaAI</h2>
            <p className="text-white/80 mb-10 text-lg leading-relaxed font-light">
              Join thousands of users building their confidence and mastering social growth.
            </p>

            <div className="space-y-4 mb-10 text-left mx-auto max-w-[220px]">
              {[
                "Personalized Roadmap",
                "Expert AI Guidance",
                "Verified Progress"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  {benefit}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-white/60">Already have an account?</p>
              <Link href="/login" className="group inline-flex items-center gap-2 bg-white text-primary hover:bg-white/90 transition-all py-3.5 px-10 font-bold text-sm rounded-full shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0">
                Sign In
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="flex-[1.2] flex flex-col items-center justify-center px-8 py-12 sm:px-16 auth-form-slide-right relative overflow-hidden">
          <div className="w-full max-w-[380px] space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary/20 shadow-inner">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-foreground font-bold text-3xl sm:text-4xl mb-3 tracking-tight">
                Create Account
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign up to get started with PersonaAI
              </p>
            </div>

            {/* Google Sign Up */}
            <div className="flex justify-center">
              <div className="w-full scale-105 transition-transform hover:scale-110">
                <GoogleLogin
                  onSuccess={handleGoogleSignup}
                  shape="pill"
                  width="100%"
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                  onError={() => {
                    setError('Google signup failed');
                    toast.error('Google signup failed');
                  }}
                />
              </div>
            </div>

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
            <SignUpForm />

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="lg:hidden fixed bottom-8 w-full text-center px-6">
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}