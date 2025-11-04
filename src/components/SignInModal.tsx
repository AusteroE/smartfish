'use client';

import { useState } from 'react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  router: AppRouterInstance;
}

export default function SignInModal({ isOpen, onClose, router }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Wait for cookie to be set before redirecting
        setTimeout(() => {
          // Check if there's a redirect parameter in the URL
          const params = new URLSearchParams(window.location.search);
          const redirectPath = params.get('redirect');

          // If redirect exists, use it (especially for admin pages)
          if (redirectPath) {
            // Verify user is admin if redirecting to admin route
            if (redirectPath.startsWith('/admin') && data.role !== 'admin') {
              setError('Admin access required');
              setLoading(false);
              return;
            }
            // Close modal first
            onClose();
            // Small delay before redirect to ensure modal closes
            setTimeout(() => {
              // Use window.location for full page reload to ensure cookies are sent
              // Add a query param to indicate we just signed in
              window.location.href = `${redirectPath}?signedIn=true`;
            }, 100);
          } else {
            // Use default redirect based on role
            onClose();
            setTimeout(() => {
              window.location.href = data.redirect_url || '/dashboard';
            }, 100);
          }
        }, 500); // Increased delay to ensure cookie is set and propagated
      } else {
        setError(data.error || 'Sign in failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-[90%] max-w-[400px] rounded-2xl border border-white/12 bg-gradient-to-b from-white/5 to-white/2 p-5 sm:p-8 text-[#e6e9ef] backdrop-blur-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="absolute right-6 top-6 cursor-pointer text-[28px] font-bold text-gray-400 hover:text-white"
          onClick={onClose}
        >
          &times;
        </span>
        <h2 className="mb-5 text-[#e6e9ef]">Sign In</h2>
        {error && (
          <p className="mb-4 text-[rgb(255,50,50)]">{error}</p>
        )}
        <form id="signInForm" onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#a2a8b6]"></i>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-white/12 bg-white/4 px-4 py-3 pl-[45px] text-base text-[#e6e9ef] outline-none transition-all focus:border-[#7c5cff] focus:shadow-[0_0_0_3px_rgba(124,92,255,0.2)]"
              required
            />
          </div>
          <div className="relative mb-5">
            <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#a2a8b6]"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="signInPassword"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-white/12 bg-white/4 px-4 py-3 pl-[45px] pr-[45px] text-base text-[#e6e9ef] outline-none transition-all focus:border-[#7c5cff] focus:shadow-[0_0_0_3px_rgba(124,92,255,0.2)]"
              required
            />
            <i
              className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#a2a8b6]`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] border-none bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] px-3 py-3 text-base font-semibold text-white transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(124,92,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
