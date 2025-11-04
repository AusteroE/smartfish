'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
    id: number;
    username: string;
    email: string;
    profile_image: string;
}

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export default function SettingsPanel({ isOpen, onClose, user }: SettingsPanelProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            setLoading(true);
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen || !user) return null;

    return (
        <>
            <div className="settings-overlay" onClick={onClose}></div>
            <section className="settings-panel">
                <button className="close-btn" onClick={onClose}>
                    &times;
                </button>
                <h2>
                    Settings
                    <i className="fas fa-cog settings-icon"></i>
                </h2>

                <div className="settings-theme">
                    <label>Theme:</label>
                    <div className="custom-dropdown" style={{ pointerEvents: 'none' }}>
                        <div className="dropdown-label">
                            Dark Mode
                            <span className="arrow">&#9662;</span>
                        </div>
                    </div>
                </div>

                <div className="profile">
                    <label htmlFor="profile-info">Profile:</label>
                    <div className="profile-row">
                        <Image
                            src={user.profile_image?.startsWith('/')
                                ? user.profile_image
                                : user.profile_image?.startsWith('frontend/')
                                    ? `/${user.profile_image}`
                                    : `/frontend/img/${user.profile_image || 'default profile.png'}`}
                            alt="Profile Picture"
                            width={80}
                            height={80}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.currentTarget.src = '/frontend/img/default profile.png';
                            }}
                        />
                        <div className="profile-info">
                            <span>
                                <strong>Username:</strong> {user.username}
                            </span>
                            <span>
                                <strong>Email:</strong> {user.email}
                            </span>
                            <span>
                                <strong>Password:</strong> ••••••••
                            </span>
                            <button className="edit-btn" title="Edit Profile">
                                <i className="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="account-actions">
                    <button className="action-btn logout-btn" onClick={handleLogout} disabled={loading}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>{loading ? 'Logging out...' : 'Logout'}</span>
                    </button>
                </div>

                <style jsx>{`
          .settings-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          }

          .settings-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 420px;
            height: 100vh;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
            border-left: 1px solid rgba(255, 255, 255, 0.14);
            backdrop-filter: blur(12px);
            padding: 30px;
            z-index: 1000;
            overflow-y: auto;
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.35);
          }

          .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #e6e9ef;
            font-size: 28px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .settings-panel h2 {
            color: #e6e9ef;
            margin-bottom: 30px;
            font-size: 1.8rem;
            font-weight: 700;
          }

          .settings-icon {
            margin-left: 10px;
            color: #7c5cff;
          }

          .settings-theme {
            margin-bottom: 30px;
          }

          .settings-theme label {
            display: block;
            color: #e6e9ef;
            margin-bottom: 10px;
            font-weight: 500;
          }

          .custom-dropdown {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            padding: 12px;
            color: #e6e9ef;
          }

          .profile {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }

          .profile label {
            display: block;
            color: #e6e9ef;
            margin-bottom: 15px;
            font-weight: 500;
          }

          .profile-row {
            display: flex;
            align-items: flex-start;
            gap: 20px;
          }

          .profile-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .profile-info span {
            color: #e6e9ef;
            font-size: 0.9rem;
          }

          .edit-btn {
            background: rgba(124, 92, 255, 0.2);
            border: 1px solid rgba(124, 92, 255, 0.35);
            color: #7c5cff;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
          }

          .edit-btn:hover {
            background: rgba(124, 92, 255, 0.3);
          }

          .account-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 14px 20px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
            color: #e6e9ef;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .action-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            border-color: rgba(124, 92, 255, 0.45);
            box-shadow: 0 8px 20px rgba(124, 92, 255, 0.18);
          }

          .logout-btn:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(124, 92, 255, 0.15), rgba(124, 92, 255, 0.08));
          }

          .action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .settings-panel {
              width: 100%;
            }
          }
        `}</style>
            </section>
        </>
    );
}

