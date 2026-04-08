'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { authValidation } from '@/lib/zod/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SignUpForm() {
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(authValidation.register),
        defaultValues: {
            username: '',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        },
    });

    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleShowPassword = () => {
        setIsShowPassword(!isShowPassword);
    };

    async function onSubmit(data) {
        if (!agreeTerms) {
            setError('Please agree to the terms and conditions');
            toast.error('Please agree to the terms and conditions');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                }),
            });

            const responseData = await res.json();

            if (!res.ok) {
                setError(responseData.message || 'Registration failed');
                toast.error(responseData.message || 'Registration failed');
                return;
            }

            // Store token and user data
            localStorage.setItem('token', responseData.token || responseData.data);
            if (responseData.user) {
                localStorage.setItem('user', JSON.stringify(responseData.user));
            }

            toast.success('Account created successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Registration error:', error);
            setError('Cannot reach server. Please try again.');
            toast.error('Cannot reach server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-92.5">
            <div className="space-y-4">
                {/* Username Input */}
                <div>
                    <Input
                        type="text"
                        placeholder="Username"
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        {...form.register('username')}
                    />
                    {form.formState.errors.username && (
                        <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.username.message}
                        </p>
                    )}
                    <p className="text-muted-foreground text-xs mt-1">
                        Letters, numbers, and underscores only
                    </p>
                </div>

                {/* First Name Input */}
                <div>
                    <Input
                        type="text"
                        placeholder="First Name"
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        {...form.register('firstName')}
                    />
                    {form.formState.errors.firstName && (
                        <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.firstName.message}
                        </p>
                    )}
                </div>

                {/* Last Name Input */}
                <div>
                    <Input
                        type="text"
                        placeholder="Last Name"
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        {...form.register('lastName')}
                    />
                    {form.formState.errors.lastName && (
                        <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.lastName.message}
                        </p>
                    )}
                </div>

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
                            placeholder="Password (min. 6 characters)"
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

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="agree_terms"
                        checked={agreeTerms}
                        onCheckedChange={setAgreeTerms}
                    />
                    <label 
                        htmlFor="agree_terms"
                        className="text-sm text-muted-foreground leading-tight cursor-pointer"
                    >
                        I agree to the{' '}
                        <a href="/terms" className="text-primary hover:text-primary/80 transition-colors">
                            Terms and Conditions
                        </a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-primary hover:text-primary/80 transition-colors">
                            Privacy Policy
                        </a>
                    </label>
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
                    disabled={isLoading || !agreeTerms}
                    className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 py-3.5 px-6 font-semibold text-primary-foreground text-sm rounded-full shadow-persona-purple hover:shadow-persona-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </div>
        </form>
    );
}