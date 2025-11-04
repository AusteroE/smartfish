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
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>
                    &times;
                </span>
                <h2>Sign Up</h2>

                <div className="profile-container">
                    <Image
                        src={profileImage || '/default profile.png'}
                        alt="Profile Picture"
                        id="profileImage"
                        width={100}
                        height={100}
                    />
                    <label htmlFor="profileInput" className="camera-icon">
                        <i className="fa-solid fa-camera"></i>
                    </label>
                    <input
                        type="file"
                        name="profile"
                        id="profileInput"
                        accept="image/*"
                        onChange={handleProfileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {error && (
                    <p style={{ color: 'rgb(255, 50, 50)', marginBottom: '15px' }}>{error}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <i className="fa-solid fa-user icon"></i>
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

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
                            id="password"
                            name="password"
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

                    <div className="input-group">
                        <i className="fa-solid fa-lock icon"></i>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <i
                            className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ cursor: 'pointer' }}
                        ></i>
                    </div>

                    <div className="terms-group">
                        <label htmlFor="termsCheckbox" className="terms-label">
                            <input
                                type="checkbox"
                                id="termsCheckbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                required
                            />
                            <span className="checkbox-circle"></span>
                            I agree to the{' '}
                            <span className="terms-link" onClick={onShowTerms}>
                                Terms and Conditions
                            </span>
                        </label>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
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
          overflow-y: auto;
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
          margin: 20px 0;
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

        .profile-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
        }

        .profile-container img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
        }

        .camera-icon {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #7c5cff;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 3px solid #0b1020;
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
          box-sizing: border-box;
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

        .terms-group {
          margin: 20px 0;
        }

        .terms-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          color: #a2a8b6;
          font-size: 14px;
        }

        .terms-label input[type='checkbox'] {
          margin-right: 10px;
          cursor: pointer;
        }

        .terms-link {
          color: #7c5cff;
          text-decoration: underline;
          cursor: pointer;
          margin-left: 5px;
        }

        .terms-link:hover {
          color: #4cc9f0;
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
          text-align: center;
        }
      `}</style>
        </div>
    );
}

