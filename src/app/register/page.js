'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  MessageCircleCode,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'available' | 'taken' | null
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chats');
    }
  }, [isAuthenticated, router]);

  // Debounced check for username availability
  useEffect(() => {
    const rawUsername = formData.username.trim().toLowerCase();
    if (rawUsername.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/auth/check-username/${encodeURIComponent(rawUsername)}`);
        setUsernameStatus(data?.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill out all fields.');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('Username is already taken. Please choose another.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success('Account created successfully! Welcome to NexChat.');
      router.push('/chats');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#0c0c11] relative overflow-hidden py-12">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 hover:scale-105 transition-transform">
              <MessageCircleCode className="w-7 h-7" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Create your Account
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Join NexChat today and start real-time conversations
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              name="name"
              placeholder="Elena Miller"
              value={formData.name}
              onChange={handleChange}
              icon={User}
              required
            />

            <div>
              <Input
                label="Username"
                name="username"
                placeholder="elenam"
                value={formData.username}
                onChange={handleChange}
                icon={AtSign}
                required
              />
              {usernameStatus === 'checking' && (
                <p className="text-[11px] text-zinc-400 mt-1">Checking username...</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> @{formData.username} is available
                </p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> @{formData.username} is already taken
                </p>
              )}
            </div>
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="elena@example.com"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            required
            autoComplete="email"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
              iconRight={showPassword ? EyeOff : Eye}
              onIconRightClick={() => setShowPassword(!showPassword)}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={Lock}
              required
              autoComplete="new-password"
            />
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
            />
            <label
              htmlFor="terms"
              className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none"
            >
              I agree to the{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terms of Service</span>{' '}
              and{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Privacy Policy</span>
            </label>
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
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
