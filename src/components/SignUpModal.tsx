'use client';

import { useState } from 'react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Image from 'next/image';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowTerms: () => void;
  router: AppRouterInstance;
}

export default function SignUpModal({ isOpen, onClose, onShowTerms, router }: SignUpModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and GIF images are allowed.');
        return;
      }

      if (file.size > maxSize) {
        setError('Image size should be less than or equal to 10MB.');
        return;
      }

      setProfileFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms and Conditions');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (profileFile) {
        formData.append('profile', profileFile);
      }

      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        setError(data.error || 'Sign up failed');
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
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50 py-5"
      onClick={onClose}
    >
      <div
        className="relative my-5 w-[90%] max-w-[400px] rounded-2xl border border-white/12 bg-gradient-to-b from-white/5 to-white/2 p-5 sm:p-8 text-[#e6e9ef] backdrop-blur-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="absolute right-6 top-6 cursor-pointer text-[28px] font-bold text-gray-400 hover:text-white"
          onClick={onClose}
        >
          &times;
        </span>
        <h2 className="mb-5 text-center text-[#e6e9ef]">Sign Up</h2>

        <div className="relative mx-auto mb-5 h-[100px] w-[100px]">
          <Image
            src={profileImage || '/default profile.png'}
            alt="Profile Picture"
            id="profileImage"
            width={100}
            height={100}
            className="h-[100px] w-[100px] rounded-full object-cover"
          />
          <label
            htmlFor="profileInput"
            className="absolute bottom-0 right-0 flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full border-[3px] border-[#0b1020] bg-[#7c5cff]"
          >
            <i className="fa-solid fa-camera"></i>
          </label>
          <input
            type="file"
            name="profile"
            id="profileInput"
            accept="image/*"
            onChange={handleProfileChange}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mb-4 text-[rgb(255,50,50)]">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#a2a8b6]"></i>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-[10px] border border-white/12 bg-white/4 px-4 py-3 pl-[45px] text-base text-[#e6e9ef] outline-none transition-all focus:border-[#7c5cff] focus:shadow-[0_0_0_3px_rgba(124,92,255,0.2)]"
              required
            />
          </div>

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
              id="password"
              name="password"
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

          <div className="relative mb-5">
            <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#a2a8b6]"></i>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-[10px] border border-white/12 bg-white/4 px-4 py-3 pl-[45px] pr-[45px] text-base text-[#e6e9ef] outline-none transition-all focus:border-[#7c5cff] focus:shadow-[0_0_0_3px_rgba(124,92,255,0.2)]"
              required
            />
            <i
              className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#a2a8b6]`}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            ></i>
          </div>

          <div className="my-5">
            <label htmlFor="termsCheckbox" className="flex cursor-pointer items-center text-sm text-[#a2a8b6]">
              <input
                type="checkbox"
                id="termsCheckbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mr-2.5 cursor-pointer"
                required
              />
              <span className="checkbox-circle"></span>
              I agree to the{' '}
              <span
                className="ml-1 cursor-pointer text-[#7c5cff] underline hover:text-[#4cc9f0]"
                onClick={onShowTerms}
              >
                Terms and Conditions
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] border-none bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] px-3 py-3 text-base font-semibold text-white transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(124,92,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
