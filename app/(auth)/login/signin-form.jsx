'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { authValidation } from '@/lib/zod/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(authValidation.login),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const [rememberMe, setRememberMe] = useState(false);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleShowPassword = () => {
        setIsShowPassword(!isShowPassword);
    };

    async function onSubmit(data) {
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                }),
            });

            const responseData = await res.json();

            if (!res.ok) {
                setError(responseData.message || 'Login failed');
                toast.error(responseData.message || 'Login failed');
                return;
            }

            // Store token and user data
            localStorage.setItem('token', responseData.data);
            if (responseData.user) {
                localStorage.setItem('user', JSON.stringify(responseData.user));
            }

            toast.success('Login successful!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setError('Cannot reach server. Please try again.');
            toast.error('Cannot reach server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-92.5">
            <div className="space-y-4">
                {/* Email Input */}
                <div>
                    <Input
                        type="email"
                        placeholder="Email"
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                        <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password Input */}
                <div>
                    <div className="relative">
                        <Input
                            type={isShowPassword ? 'text' : 'password'}
                            placeholder="Password"
                            disabled={isLoading}
                            className="w-full px-4 py-3.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background transition-all duration-200 text-foreground placeholder:text-muted-foreground pr-12"
                            {...form.register('password')}
                        />
                        <button
                            type="button"
                            title={isShowPassword ? 'Hide password' : 'Show password'}
                            aria-label={isShowPassword ? 'Hide password' : 'Show password'}
                            onClick={handleShowPassword}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isShowPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>
                    {form.formState.errors.password && (
                        <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.password.message}
                        </p>
                    )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remember_me"
                            checked={rememberMe}
                            onCheckedChange={setRememberMe}
                        />
                        <label
                            htmlFor="remember_me"
                            className="text-sm text-muted-foreground cursor-pointer select-none"
                        >
                            Keep me logged in
                        </label>
                    </div>

                    <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="w-full px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 py-3.5 px-6 font-semibold text-primary-foreground text-sm rounded-full shadow-persona-purple hover:shadow-persona-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </div>
        </form>
    );
}