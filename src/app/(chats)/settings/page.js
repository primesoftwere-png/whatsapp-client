'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useContactStore } from '@/stores/useContactStore';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
  Settings,
  User,
  Shield,
  Palette,
  KeyRound,
  UserX,
  Camera,
  Sun,
  Moon,
  Laptop,
  Check,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateProfile, updateAvatar, updatePrivacy } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { blockedUsers, fetchBlockedUsers, unblockUser, isLoadingBlocks } = useContactStore();

  const [activeSection, setActiveSection] = useState('profile'); // profile, privacy, appearance, security, blocked

  // Profile Form state
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    bio: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef(null);

  // Privacy toggles state
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    readReceipts: true,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Security Form state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
      });
      if (user.privacySettings) {
        setPrivacySettings({
          showOnlineStatus: user.privacySettings.showOnlineStatus ?? true,
          showLastSeen: user.privacySettings.showLastSeen ?? true,
          readReceipts: user.privacySettings.readReceipts ?? true,
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'blocked') {
      fetchBlockedUsers();
    }
  }, [activeSection, fetchBlockedUsers]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    const toastId = toast.loading('Uploading avatar...');
    try {
      await updateAvatar(formData);
      toast.success('Avatar updated', { id: toastId });
    } catch {
      toast.error('Failed to update avatar', { id: toastId });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handlePrivacyToggle = async (key) => {
    const nextBool = !privacySettings[key];
    const nextSettings = {
      ...privacySettings,
      [key]: nextBool,
    };
    setPrivacySettings(nextSettings);

    try {
      const payload = {
        showOnlineStatus: (key === 'showOnlineStatus' ? nextBool : privacySettings.showOnlineStatus) ? 'everyone' : 'nobody',
        showLastSeen: (key === 'showLastSeen' ? nextBool : privacySettings.showLastSeen) ? 'everyone' : 'nobody',
        showReadReceipts: key === 'readReceipts' ? nextBool : privacySettings.readReceipts,
      };
      await updatePrivacy(payload);
      toast.success('Privacy preferences saved');
    } catch {
      toast.error('Failed to update privacy settings');
      setPrivacySettings(privacySettings);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (!securityData.currentPassword || !securityData.newPassword) {
      toast.error('Please enter both current and new password');
      return;
    }
    if (securityData.newPassword !== securityData.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (securityData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSavingSecurity(true);
    try {
      const { changePassword } = useAuthStore.getState();
      await changePassword(
        securityData.currentPassword,
        securityData.newPassword
      );
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await unblockUser(userId);
      toast.success('User unblocked');
    } catch {
      toast.error('Failed to unblock user');
    }
  };

  const sections = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'privacy', label: 'Privacy & Discretion', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security & Password', icon: KeyRound },
    { id: 'blocked', label: 'Blocked Accounts', icon: UserX },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Personalize your profile, privacy preferences, and theme
          </p>
        </div>
      </div>

      {/* Main Content with Nav Pills */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Navigation List - Horizontal scroll on mobile, vertical stack on desktop */}
          <div className="flex md:flex-col overflow-x-auto no-scrollbar gap-1.5 pb-2 md:pb-0 md:space-y-1 shrink-0">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap text-left shrink-0 ${
                    activeSection === sec.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section Detail Panel */}
          <div className="md:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            {/* 1. PROFILE */}
            {activeSection === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Profile Information
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Update your public display name, photo, and bio
                  </p>
                </div>

                {/* Avatar Uploader */}
                <div className="flex items-center gap-5 pt-2">
                  <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <Avatar
                      src={user?.avatar}
                      name={user?.name || user?.username}
                      size="2xl"
                      className="ring-4 ring-emerald-50 dark:ring-emerald-950/40"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      icon={Camera}
                    >
                      Change Photo
                    </Button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    placeholder="Elena Miller"
                    required
                  />

                  <Input
                    label="Username"
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData({ ...profileData, username: e.target.value })
                    }
                    placeholder="elenam"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Bio / About
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    rows={3}
                    placeholder="A little bit about yourself..."
                    className="w-full text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingProfile}
                    icon={Save}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {/* 2. PRIVACY */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Privacy Controls
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Decide who can see your online presence and reading activities
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Show Online Status */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Online Status
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Allow other users to see when you are currently online
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyToggle('showOnlineStatus')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacySettings.showOnlineStatus ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacySettings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Show Last Seen */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Last Seen Timestamp
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Display when you were last active in chats
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyToggle('showLastSeen')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacySettings.showLastSeen ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacySettings.showLastSeen ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Read Receipts */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Read Receipts
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Show double checkmarks when you have read incoming messages
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrivacyToggle('readReceipts')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacySettings.readReceipts ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacySettings.readReceipts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. APPEARANCE */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Theme Appearance
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Choose how NexChat looks to you. Seamlessly switch between Light and Dark mode
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                    { key: 'system', label: 'System', icon: Laptop },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.key;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setTheme(item.key)}
                        className={`p-4 rounded-2xl border cursor-pointer text-center flex flex-col items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SECURITY */}
            {activeSection === 'security' && (
              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Change Password
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Ensure your account is using a strong, unique password
                  </p>
                </div>

                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={securityData.currentPassword}
                  onChange={(e) =>
                    setSecurityData({ ...securityData, currentPassword: e.target.value })
                  }
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={securityData.newPassword}
                  onChange={(e) =>
                    setSecurityData({ ...securityData, newPassword: e.target.value })
                  }
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={securityData.confirmNewPassword}
                  onChange={(e) =>
                    setSecurityData({
                      ...securityData,
                      confirmNewPassword: e.target.value,
                    })
                  }
                  required
                />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingSecurity}
                    icon={Save}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            )}

            {/* 5. BLOCKED ACCOUNTS */}
            {activeSection === 'blocked' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Blocked Accounts
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Users you block will not be able to send you messages or view your status
                  </p>
                </div>

                {isLoadingBlocks ? (
                  <div className="py-8 flex justify-center">
                    <Spinner size="md" text="Loading blocked users..." />
                  </div>
                ) : blockedUsers.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    {blockedUsers.map((item) => {
                      const u = item.blocked || item.blockedUser || item.user || item;
                      return (
                        <div
                          key={u._id || u.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar src={u.avatar} name={u.name || u.username} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {u.name || u.username}
                              </p>
                              <p className="text-xs text-zinc-500">@{u.username}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUnblock(u._id || u.id)}
                          >
                            Unblock
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-zinc-500 text-xs">
                    You have not blocked any accounts.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
