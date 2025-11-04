'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SignInModal from '@/components/SignInModal';
import SignUpModal from '@/components/SignUpModal';
import TermsModal from '@/components/TermsModal';

export default function Home() {
  const router = useRouter();
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for verification message in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setMessage({ type: 'success', text: 'Email verified successfully! You can now log in.' });
    } else if (params.get('error')) {
      const error = params.get('error');
      const errorMessages: Record<string, string> = {
        invalid_token: 'Invalid verification token',
        token_not_found: 'Verification token not found',
        already_verified: 'Email is already verified',
        token_expired: 'Verification token has expired',
        verification_failed: 'Email verification failed. Please try again.',
      };
      setMessage({ type: 'error', text: errorMessages[error || ''] || 'An error occurred' });
    }

    // Auto-open sign-in modal if redirected from admin route
    if (params.get('signin') === 'true') {
      setSignInOpen(true);
      // Keep redirect parameter in URL for sign-in modal to use
      // Don't remove it yet - the sign-in modal needs it
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
      `}</style>
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(124,92,255,0.18),transparent),radial-gradient(900px_500px_at_100%_10%,rgba(76,201,240,0.15),transparent),#0b1020] p-4 sm:p-5 font-['Inter',system-ui,-apple-system,sans-serif] text-[#e6e9ef]">
        {message && (
          <div
            className={`fixed top-5 right-5 z-[10000] rounded-lg border px-5 py-4 ${message.type === 'success'
                ? 'border-[#c3e6cb] bg-[#d4edda] text-[#155724]'
                : 'border-[#f5c6cb] bg-[#f8d7da] text-[#721c24]'
              }`}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-2.5 cursor-pointer border-none bg-transparent"
            >
              ×
            </button>
          </div>
        )}

        <div className="w-full max-w-[800px] text-center">
          <div className="mb-6 sm:mb-10 flex justify-center">
            <Image
              src="/smartfishcarelogo.png"
              alt="Smart Fish Care Logo"
              className="h-auto w-auto max-w-[120px] sm:max-w-[150px]"
              width={100}
              height={100}
              priority
            />
          </div>

          <h1 className="mb-4 sm:mb-5 text-3xl sm:text-4xl md:text-[3.5rem] font-bold leading-tight px-4">
            Get Smart Care <br />
            <span className="bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] bg-clip-text text-transparent">
              For Fish
            </span>
          </h1>
          <p className="px-4">
            <span className="inline-block text-base sm:text-lg md:text-xl leading-relaxed text-[#a2a8b6]">
              Your ultimate companion for thriving happy fish. Stay on top of water quality, feeding
              schedules, and more because your fish deserve the absolute best care.
            </span>
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-5 px-4">
            <button
              id="signInBtn"
              onClick={() => setSignInOpen(true)}
              className="group relative overflow-hidden rounded-[50px] border-none bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,92,255,0.4)] w-full sm:w-auto"
            >
              <div className="absolute left-0 top-0 h-full w-1/2 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0"></div>
              <span className="relative z-10">Sign In</span>
              <div className="absolute right-0 top-0 h-full w-1/2 translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0"></div>
            </button>

            <button
              id="signUpBtn"
              onClick={() => setSignUpOpen(true)}
              className="group relative overflow-hidden rounded-[50px] border-none bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,92,255,0.4)] w-full sm:w-auto"
            >
              <div className="absolute left-0 top-0 h-full w-1/2 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0"></div>
              <span className="relative z-10">Sign Up</span>
              <div className="absolute right-0 top-0 h-full w-1/2 translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0"></div>
            </button>
          </div>
        </div>

        <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} router={router} />
        <SignUpModal
          isOpen={signUpOpen}
          onClose={() => setSignUpOpen(false)}
          onShowTerms={() => setTermsOpen(true)}
          router={router}
        />
        <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
      </div>
    </>
  );
}
