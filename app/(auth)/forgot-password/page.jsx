'use client';

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from "sonner";
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import FloatingLines from '@/app/components/landing/ui/FloatingLines';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(
        "/api/auth/forgot-password",
        { email }
      );

      toast.success(res.data.message || "Recovery email sent successfully!");

      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send recovery email");
    } finally {
      setIsLoading(false);
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

      <div className="w-full max-w-[900px] flex rounded-2xl shadow-2xl overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 z-10 transition-all duration-300">

        {/* Left Side - Form Input */}
        <div className="flex-1 flex flex-col justify-center bg-card px-8 py-12 sm:px-16 auth-form-slide-left relative">

          <Link
            href="/login"
            className="absolute top-8 left-8 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <div className="w-full max-w-[360px] mx-auto space-y-6 mt-12">

            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-foreground font-bold text-2xl sm:text-3xl mb-3">
                Forgot Password
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-all shadow-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send Recovery Link"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Right Side - Visual/Brand Block */}
        <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center gradient-persona-primary p-8 text-center auth-form-slide-right relative overflow-hidden">

          <div className="relative z-10 max-w-sm">
            <h2 className="text-white font-bold text-3xl mb-6">
              Secure Account Recovery
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              We take your security seriously. Verify your email to regain access to your PersonaAI Command Center and continue your journey.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}