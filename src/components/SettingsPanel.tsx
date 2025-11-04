'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  email: string;
  profile_image: string;
  role?: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function SettingsPanel({ isOpen, onClose, user, onUserUpdate }: SettingsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setProfileImage(null);
    }
  }, [user]);

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

  const handleSave = async () => {
    if (!username || !email) {
      setError('Username and email are required');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      if (profileFile) {
        formData.append('profile', profileFile);
      }

      const response = await fetch('/api/user/update', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        setProfileFile(null);
        setProfileImage(null);

        // Update parent component if callback provided
        if (onUserUpdate && data.user) {
          onUserUpdate({
            ...data.user,
            role: data.user.role || user?.role || 'user',
          });
        }

        // Reload page after 1 second to refresh user data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setProfileImage(null);
      setProfileFile(null);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      setLoading(true);
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getProfileImageSrc = () => {
    if (profileImage) return profileImage;
    if (!user?.profile_image) {
      return '/frontend/img/default profile.png';
    }
    if (user.profile_image.startsWith('/')) {
      return user.profile_image;
    }
    if (user.profile_image.startsWith('uploads/')) {
      return `/${user.profile_image}`;
    }
    if (user.profile_image.startsWith('frontend/')) {
      return `/${user.profile_image}`;
    }
    return `/frontend/img/${user.profile_image}`;
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/50"
        onClick={onClose}
      ></div>
      <section className="fixed right-0 top-0 z-[1000] h-screen w-full sm:w-[420px] overflow-y-auto border-l border-white/14 bg-gradient-to-b from-white/7 to-white/2 p-4 sm:p-8 shadow-[-10px_0_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <button
          className="absolute right-5 top-5 h-10 w-10 rounded-full border-none bg-white/10 text-[28px] text-[#e6e9ef] transition-all hover:bg-white/20"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="mb-8 text-[1.8rem] font-bold text-[#e6e9ef]">
          Settings
          <i className="ml-2.5 text-[#7c5cff] fas fa-cog"></i>
        </h2>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-300">
            <i className="fas fa-check-circle mr-2"></i>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <div className="mb-8 rounded-xl border border-white/12 bg-gradient-to-b from-white/6 to-white/2 p-5">
          <div className="flex items-center justify-between mb-4">
            <label className="block font-medium text-[#e6e9ef]">Profile</label>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg border border-[#7c5cff]/35 bg-[#7c5cff]/20 text-sm text-[#7c5cff] transition-all hover:bg-[#7c5cff]/30"
                title="Edit Profile"
              >
                <i className="fas fa-edit mr-2"></i>Edit
              </button>
            )}
          </div>

          <div className="flex items-start gap-5">
            <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
              <Image
                src={getProfileImageSrc()}
                alt="Profile Picture"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/frontend/img/default profile.png';
                }}
              />
              {editing && (
                <label
                  htmlFor="profileInput"
                  className="absolute bottom-0 right-0 bg-[#7c5cff] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-2 border-[#0b1020] hover:bg-[#6b4ce6] transition-colors z-10"
                  title="Change Profile Picture"
                >
                  <i className="fas fa-camera text-white text-xs"></i>
                </label>
              )}
              <input
                type="file"
                id="profileInput"
                accept="image/*"
                onChange={handleProfileChange}
                className="hidden"
                disabled={!editing}
              />
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs text-[#a2a8b6] mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-white/4 border border-white/12 rounded-lg text-sm text-[#e6e9ef] focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff]/20"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a2a8b6] mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white/4 border border-white/12 rounded-lg text-sm text-[#e6e9ef] focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff]/20"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSave}
                      disabled={uploading}
                      className="flex-1 px-4 py-2 bg-[#7c5cff] text-white rounded-lg text-sm font-semibold hover:bg-[#6b4ce6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={uploading}
                      className="px-4 py-2 bg-white/4 border border-white/12 text-[#e6e9ef] rounded-lg text-sm font-semibold hover:bg-white/6 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-[#e6e9ef]">
                    <strong>Username:</strong> {user.username}
                  </span>
                  <span className="text-sm text-[#e6e9ef]">
                    <strong>Email:</strong> {user.email}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="logout-btn flex items-center justify-center gap-3 rounded-xl border border-white/12 bg-gradient-to-b from-white/5 to-white/2 px-5 py-4 text-sm font-semibold text-[#e6e9ef] transition-all hover:-translate-y-0.5 hover:border-[#7c5cff]/45 hover:bg-gradient-to-b hover:from-[#7c5cff]/15 hover:to-[#7c5cff]/8 hover:shadow-[0_8px_20px_rgba(124,92,255,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleLogout}
            disabled={loading}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>{loading ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </section>
    </>
  );
}
