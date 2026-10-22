'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { MessageCircleCode, Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Password reset instructions sent');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#0c0c11] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <MessageCircleCode className="w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Check your inbox
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We&apos;ve sent password reset instructions to{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{email}</strong>.
            </p>
            <div className="pt-4">
              <Link href="/login">
                <Button variant="secondary" className="w-full" icon={ArrowLeft}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
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

            <Button
              type="submit"
              className="w-full mt-2 font-semibold shadow-md shadow-indigo-600/25"
              size="lg"
              isLoading={isLoading}
              icon={Send}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
