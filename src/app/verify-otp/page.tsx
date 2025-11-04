'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      router.push('/');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/?verified=true');
      } else {
        setError(data.error || 'Invalid or expired OTP code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <div className="otp-icon">🔐</div>
        <h2>OTP Verification</h2>
        <p>Please enter the 6-digit code sent to your email address.</p>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="email" value={email} />
          <input
            type="text"
            name="otp"
            className="otp-input"
            placeholder="000000"
            maxLength={6}
            pattern="[0-9]{6}"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(value);
            }}
            required
            autoFocus
          />
          <br />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <p style={{ marginTop: '30px', color: '#666' }}>
          <small>Didn&apos;t receive the code? Check your spam folder</small>
        </p>
      </div>

      <style jsx>{`
        .otp-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: radial-gradient(1200px 600px at 20% -10%, rgba(124, 92, 255, 0.18), transparent),
                     radial-gradient(900px 500px at 100% 10%, rgba(76, 201, 240, 0.15), transparent),
                     #0b1020;
          color: #e6e9ef;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding: 20px;
        }

        .otp-box {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          text-align: center;
          max-width: 500px;
          width: 90%;
          color: #e6e9ef;
        }

        .otp-icon {
          font-size: 64px;
          margin-bottom: 20px;
          filter: drop-shadow(0 0 10px rgba(124, 92, 255, 0.3));
        }

        .otp-input {
          width: 100%;
          padding: 20px;
          font-size: 24px;
          text-align: center;
          letter-spacing: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 15px;
          margin: 20px 0;
          outline: none;
          transition: all 0.3s ease;
          color: #e6e9ef;
          font-weight: 600;
          box-sizing: border-box;
        }

        .otp-input:focus {
          border-color: #7c5cff;
          box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.45);
          background: rgba(255, 255, 255, 0.06);
        }

        .btn {
          display: inline-block;
          padding: 15px 35px;
          background: linear-gradient(135deg, #7c5cff, #4cc9f0);
          color: white;
          text-decoration: none;
          border-radius: 15px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(124, 92, 255, 0.3);
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 92, 255, 0.4);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 15px 20px;
          border-radius: 12px;
          margin: 20px 0;
          font-weight: 500;
        }

        .error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1);
        }

        h2 {
          color: #e6e9ef;
          margin-bottom: 10px;
          font-weight: 700;
        }

        p {
          color: #a2a8b6;
          margin-bottom: 30px;
        }
      `}</style>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="otp-container">
        <div className="otp-box">
          <div className="otp-icon">🔐</div>
          <h2>Loading...</h2>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}

