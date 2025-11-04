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
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                router.push(data.redirect_url || '/dashboard');
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
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>
                    &times;
                </span>
                <h2>Sign In</h2>
                {error && (
                    <p style={{ color: 'rgb(255, 50, 50)', marginBottom: '15px' }}>{error}</p>
                )}
                <form id="signInForm" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <i className="fa-solid fa-envelope icon"></i>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <i className="fa-solid fa-lock icon"></i>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            id="signInPassword"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <i
                            className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: 'pointer' }}
                        ></i>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
            <style jsx>{`
        .modal {
          display: flex;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 400px;
          position: relative;
          color: #e6e9ef;
        }

        .close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }

        .close:hover {
          color: #fff;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-group .icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #a2a8b6;
        }

        .input-group input {
          width: 100%;
          padding: 12px 15px 12px 45px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #e6e9ef;
          font-size: 16px;
        }

        .input-group input:focus {
          outline: none;
          border-color: #7c5cff;
          box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.2);
        }

        .toggle-password {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
        }

        button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #7c5cff, #4cc9f0);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 92, 255, 0.4);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        h2 {
          margin-bottom: 20px;
          color: #e6e9ef;
        }
      `}</style>
        </div>
    );
}

