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
  }, []);

  return (
    <div className="container">
      {message && (
        <div
          className={`message ${message.type === 'success' ? 'success' : 'error'}`}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            zIndex: 10000,
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      <div className="hero">
        <div className="hero-header">
          <Image
            src="/smartfishcarelogo.png"
            alt="Smart Fish Care Logo"
            className="logo"
            width={100}
            height={100}
            priority
          />
        </div>

        <h1>
          Get Smart Care <br />
          <span>For Fish</span>
        </h1>
        <p>
          <span className="typewriter-text">
            Your ultimate companion for thriving happy fish. Stay on top of water quality, feeding
            schedules, and more because your fish deserve the absolute best care.
          </span>
        </p>

        <div className="buttons">
          <button
            id="signInBtn"
            onClick={() => setSignInOpen(true)}
            style={{ '--content': "'Sign In'" } as React.CSSProperties}
          >
            <div className="left"></div>
            <span className="hidden-text">Sign In</span>
            <div className="right"></div>
          </button>

          <button
            id="signUpBtn"
            onClick={() => setSignUpOpen(true)}
            style={{ '--content': "'Sign Up'" } as React.CSSProperties}
          >
            <div className="left"></div>
            <span className="hidden-text">Sign Up</span>
            <div className="right"></div>
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

      <style jsx global>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(1200px 600px at 20% -10%, rgba(124, 92, 255, 0.18), transparent),
                     radial-gradient(900px 500px at 100% 10%, rgba(76, 201, 240, 0.15), transparent),
                     #0b1020;
          color: #e6e9ef;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding: 20px;
        }

        .hero {
          text-align: center;
          max-width: 800px;
          width: 100%;
        }

        .hero-header {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 40px;
        }

        .logo {
          height: auto;
          width: auto;
          max-width: 150px;
        }

        h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        h1 span {
          background: linear-gradient(135deg, #7c5cff, #4cc9f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .typewriter-text {
          font-size: 1.2rem;
          color: #a2a8b6;
          line-height: 1.6;
          display: inline-block;
        }

        .buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        button {
          position: relative;
          padding: 15px 40px;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #7c5cff, #4cc9f0);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 92, 255, 0.4);
        }

        button .left,
        button .right {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease;
        }

        button .left {
          left: -100%;
        }

        button .right {
          right: -100%;
        }

        button:hover .left {
          left: 0;
        }

        button:hover .right {
          right: 0;
        }

        .hidden-text {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
