'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { MessageCircleCode, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chats');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to NexChat!');
      router.push('/chats');
    } catch (err) {
      const msg = err.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#0c0c11] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 hover:scale-105 transition-transform">
              <MessageCircleCode className="w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Sign In to NexChat
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            Enter your credentials to access your conversations
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
            autoComplete="email"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              iconRight={showPassword ? EyeOff : Eye}
              onIconRightClick={() => setShowPassword(!showPassword)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-2 font-semibold shadow-md shadow-emerald-600/25"
            size="lg"
            isLoading={isLoading}
            icon={ArrowRight}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
