'use client';

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from 'next/link';
import { ArrowLeft, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from "sonner";
import { useTheme } from 'next-themes';
import FloatingLines from '@/app/components/landing/ui/FloatingLines';

const ResetPasswordForm = () => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = React.useState(false);

  const router = useRouter();
  const { theme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  React.useEffect(() => {
    if (!email) {
      router.replace('/forgot-password');
    }
  }, [email, router]);

  const handleResend = async () => {
    if (!email) {
      toast.error("User email not found. Please go back and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        "/api/auth/forgot-password",
        { email }
      );
      toast.success(res.data.message || "A new code has been sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        "/api/auth/verify-reset-otp",
        {
          email,
          otp,
          newPassword,
        }
      );

      toast.success(res.data.message || "Password reset successfully!");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
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
            href="/forgot-password"
            className="absolute top-8 left-8 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="w-full max-w-[360px] mx-auto space-y-6 mt-8">

            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-foreground font-bold text-2xl sm:text-3xl mb-3">
                Reset Password
              </h1>
              <p className="text-muted-foreground text-sm">
                We've sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>. Enter it below with your new password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-all shadow-xs text-center tracking-widest font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-all shadow-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Update Password"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Didn't receive a code?{' '}
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                >
                  Resend Link
                </button>
              </p>
            </div>

          </div>
        </div>

        {/* Right Side - Visual/Brand Block */}
        <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center gradient-persona-primary p-8 text-center auth-form-slide-right relative overflow-hidden">
          <div className="relative z-10 max-w-sm">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white font-bold text-3xl mb-6">
              Almost There!
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Once you reset your password, you'll be able to access your full PersonaAI dashboard again. Remember to use a strong, unique password.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}