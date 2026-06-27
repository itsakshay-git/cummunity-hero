/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Sun, Moon, Lock, Mail, Map, Bell, 
  CheckCircle, AlertTriangle, Shield, User as UserIcon, Calendar,
  Sparkles, Sliders, Palette, Trash2
} from 'lucide-react';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../services/firebase/firebaseClient';
import { User, Community, Issue, UserRole } from '../../../types';
import Badge from '../../../components/ui/Badge';
import { CITIES_MAPPING } from '../../../lib/constants';

interface SettingsPageProps {
  user: User;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onNavigate: (tab: string) => void;
  onResetDatabase: () => Promise<void>;
  onDeleteAccount: () => Promise<{ success: boolean; reason?: string; details?: any }>;
  communities: Community[];
  issues: Issue[];
  onRoleChange?: (role: UserRole) => Promise<void>;
  onUpdateProfile?: (updates: Partial<User>) => Promise<void>;
}

export default function SettingsPage({
  user,
  theme,
  toggleTheme,
  onNavigate,
  onResetDatabase,
  onDeleteAccount,
  communities,
  issues,
  onRoleChange,
  onUpdateProfile
}: SettingsPageProps) {
  // Navigation Tabs for Settings Page
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'account' | 'preferences' | 'roles'>('appearance');
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleResetSandbox = async () => {
    if (!window.confirm("Are you sure you want to restore the sandbox database to factory mock data? This will clear all custom comments, incidents, and approvals you created.")) {
      return;
    }
    setResetLoading(true);
    try {
      await onResetDatabase();
    } catch (e) {
      console.error(e);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccountClick = async () => {
    // 1. Guardrail Check: Unresolved Issues
    const pending = issues.filter(i => i.reportedBy === user.id && i.status !== 'RESOLVED');
    if (pending.length > 0) {
      alert(`Account Deletion Blocked:\n\nYou have ${pending.length} unresolved issue reports:\n${pending.map(i => `• ${i.title}`).join('\n')}\n\nYou must resolve or delete these reports before deleting your account.`);
      return;
    }

    // 2. Guardrail Check: Community Admin Ownership
    const adminComms = communities.filter(c => c.adminIds.includes(user.id));
    if (adminComms.length > 0) {
      const hasOther = adminComms.some(c => c.memberIds.length > 1);
      if (hasOther) {
        alert(`Account Deletion Blocked:\n\nYou are the Admin of the following community spaces:\n${adminComms.filter(c => c.memberIds.length > 1).map(c => `• ${c.name}`).join('\n')}\n\nYou must transfer Admin ownership to another member before deleting your account.`);
      } else {
        alert(`Account Deletion Blocked:\n\nYou are the Admin and only member of the following community spaces:\n${adminComms.filter(c => c.memberIds.length <= 1).map(c => `• ${c.name}`).join('\n')}\n\nYou must delete or leave these spaces first.`);
      }
      return;
    }

    // 3. Final Warning confirmation
    if (!window.confirm("WARNING: Are you sure you want to permanently delete your Civic Hero account? All profile metrics and joined community details will be wiped. This action is irreversible. Proceed?")) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await onDeleteAccount();
      if (result.success) {
        alert("Your account has been successfully deleted.");
      } else {
        alert(`Failed to delete account: ${result.details || result.reason}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error deleting account: ${e.message || e.toString()}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email Reset State
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  // Preferences State
  const [defaultMap, setDefaultMap] = useState<'google' | 'osm'>(() => {
    return (localStorage.getItem('default_map_provider') as 'google' | 'osm') || 'google';
  });
  const [muteNotifications, setMuteNotifications] = useState<boolean>(() => {
    return localStorage.getItem('preferences_mute_notifications') === 'true';
  });

  const handleMapPreferenceChange = (provider: 'google' | 'osm') => {
    setDefaultMap(provider);
    localStorage.setItem('default_map_provider', provider);
  };

  const handleNotificationsChange = (checked: boolean) => {
    setMuteNotifications(checked);
    localStorage.setItem('preferences_mute_notifications', String(checked));
  };

  // Direct Password Reset Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: '' });

    if (!newPassword) {
      setPasswordStatus({ type: 'error', message: 'Password field cannot be empty.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setPasswordStatus({ type: 'error', message: 'No active session found. Please sign in again.' });
      return;
    }

    const isGoogleUser = firebaseUser.providerData.some(
      (profile) => profile.providerId === 'google.com'
    );
    if (isGoogleUser) {
      setPasswordStatus({
        type: 'error',
        message: 'Your account is linked to Google Auth. Password settings must be managed in your Google profile.'
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(firebaseUser, newPassword);
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password Update Error:', error);
      if (error.code === 'auth/requires-recent-login') {
        setPasswordStatus({
          type: 'error',
          message: 'Sensitive security actions require a recent sign-in. Please log out and log back in to proceed.'
        });
      } else {
        setPasswordStatus({
          type: 'error',
          message: error.message || 'Failed to update password.'
        });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Password Reset Email link handler
  const handleSendResetEmail = async () => {
    setEmailStatus({ type: null, message: '' });
    const emailToUse = auth.currentUser?.email || user.email;
    if (!emailToUse) {
      setEmailStatus({ type: 'error', message: 'No email associated with this account.' });
      return;
    }

    setEmailLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailToUse);
      setEmailStatus({
        type: 'success',
        message: `Password reset email sent to: ${emailToUse}`
      });
    } catch (error: any) {
      console.error('Email Reset error:', error);
      setEmailStatus({
        type: 'error',
        message: error.message || 'Failed to send password reset email.'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      
      {/* Settings Page Header (Borderless, Premium typography) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Settings
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Manage preferences, appearance theme, and account credentials.</p>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer bg-white dark:bg-slate-900"
        >
          My Profile
        </button>
      </div>

      {/* Main Panel - Split-view Layout */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Side: Modern Anchor Navigation */}
        <nav className="w-full md:w-56 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveSettingsTab('appearance')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all text-left cursor-pointer border-0 w-full whitespace-nowrap ${
              activeSettingsTab === 'appearance' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Palette className="w-4 h-4 text-emerald-500" />
            <span>Appearance</span>
          </button>
          <button
            onClick={() => setActiveSettingsTab('account')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all text-left cursor-pointer border-0 w-full whitespace-nowrap ${
              activeSettingsTab === 'account' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>Security & Auth</span>
          </button>
          <button
            onClick={() => setActiveSettingsTab('preferences')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all text-left cursor-pointer border-0 w-full whitespace-nowrap ${
              activeSettingsTab === 'preferences' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>Preferences</span>
          </button>
          <button
            onClick={() => setActiveSettingsTab('roles')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all text-left cursor-pointer border-0 w-full whitespace-nowrap ${
              activeSettingsTab === 'roles' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Civic Roles Guide</span>
          </button>
        </nav>

        {/* Right Side: Clean Active Content Panel (No nested box bounds) */}
        <div className="flex-grow w-full space-y-6">
          
          {/* TAB 1: APPEARANCE */}
          {activeSettingsTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-205 uppercase tracking-wider">Appearance settings</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">Choose between the light mode canvas or the dark mode console interface.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Mode Picker */}
                <button 
                  onClick={() => { if (theme === 'dark') toggleTheme(); }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all bg-white dark:bg-slate-900 ${
                    theme === 'light' 
                      ? 'border-emerald-500 bg-emerald-50/5 ring-2 ring-emerald-500/10 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <Sun className={`w-4.5 h-4.5 ${theme === 'light' ? 'text-emerald-600' : 'text-slate-450'}`} />
                    {theme === 'light' && (
                      <Badge variant="color" colorClass="bg-emerald-50 text-emerald-700 border-emerald-100 text-[6px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 dark:text-slate-200">Light theme</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">Off-white backdrop, soft borders and high text contrast.</span>
                  </div>
                </button>

                {/* Dark Mode Picker */}
                <button 
                  onClick={() => { if (theme === 'light') toggleTheme(); }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all bg-white dark:bg-slate-900 ${
                    theme === 'dark' 
                      ? 'border-emerald-500 bg-slate-900/40 dark:bg-slate-900/60 ring-2 ring-emerald-500/10 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <Moon className={`w-4.5 h-4.5 ${theme === 'dark' ? 'text-emerald-500' : 'text-slate-450'}`} />
                    {theme === 'dark' && (
                      <Badge variant="color" colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[6px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 dark:text-slate-200">Dark theme</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">Deep charcoal design, muted borders and lower light emission.</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & AUTH */}
          {activeSettingsTab === 'account' && (
            <div className="space-y-6">
              
              {/* Account details summary */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.photoUrl} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div>
                    <h3 className="font-extrabold text-[12px] text-slate-900 dark:text-slate-200 leading-tight">{user.name}</h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">@{user.username || 'civic_hero'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <div>Email: <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong></div>
                  <div>Role: <strong className="text-slate-700 dark:text-slate-300">{user.role}</strong></div>
                  <div>Created: <strong className="text-slate-700 dark:text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</strong></div>
                </div>
              </div>

              {/* Direct reset password form */}
              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-400" />
                    Change Account Password
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Provide your new credential details directly to update your auth context.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {passwordStatus.type && (
                    <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                      passwordStatus.type === 'success' 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                    }`}>
                      {passwordStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{passwordStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-3.5 py-2 bg-slate-905 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {passwordLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Password email link fallback */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Reset via Email Link
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                    Receive a secure, single-use authentication link to reset your account password from your email inbox.
                  </p>
                </div>

                {emailStatus.type && (
                  <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    emailStatus.type === 'success' 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-450'
                  }`}>
                    {emailStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{emailStatus.message}</span>
                  </div>
                )}

                <button
                  onClick={handleSendResetEmail}
                  disabled={emailLoading}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 bg-white dark:bg-slate-900"
                >
                  {emailLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              {/* Danger Zone: Permanent Account Deletion */}
              <div className="pt-6 border-t border-red-100 dark:border-red-950/30 space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold text-red-650 dark:text-red-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Danger Zone
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                    Permanently delete your Civic Hero account and all associated profile records. This action cannot be undone.
                  </p>
                </div>

                <button
                  onClick={handleDeleteAccountClick}
                  disabled={deleteLoading}
                  className="px-3.5 py-2 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting Account...' : 'Delete My Account'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeSettingsTab === 'preferences' && (
            <div className="space-y-6">
              
              {/* Map Preference */}
              <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-slate-400" />
                    Map Canvas Preference
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Select which interactive map projection is loaded by default in the Map Explorer tab.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg max-w-xs">
                  <button
                    onClick={() => handleMapPreferenceChange('google')}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer border-0 ${
                      defaultMap === 'google' 
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Google Maps
                  </button>
                  <button
                    onClick={() => handleMapPreferenceChange('osm')}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer border-0 ${
                      defaultMap === 'osm' 
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    OpenStreetMap
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-slate-400" />
                    Civic Alerts & Notifications
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Mute or enable real-time alert updates regarding critical incidents reported near your coordinates.</p>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md transition-colors">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                    Mute community hazard alerts
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={muteNotifications}
                      onChange={(e) => handleNotificationsChange(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Civic Profile Details */}
              <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Civic Jurisdiction & Role
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Configure your primary civic city jurisdiction and community contribution role.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Primary City</label>
                    <select
                      value={user.city || 'Chandrapur'}
                      onChange={async (e) => {
                        if (onUpdateProfile) {
                          const newCity = e.target.value;
                          const cityInfo = CITIES_MAPPING.find(c => c.city === newCity) || CITIES_MAPPING[0];
                          await onUpdateProfile({
                            city: cityInfo.city,
                            district: cityInfo.district,
                            state: cityInfo.state,
                            location: `${cityInfo.city}, ${cityInfo.state}`
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      {CITIES_MAPPING.map((c) => (
                        <option key={c.city} value={c.city} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {c.label} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Civic Role</label>
                    <select
                      value={user.role || 'Citizen'}
                      onChange={async (e) => {
                        if (onUpdateProfile) {
                          await onUpdateProfile({
                            role: e.target.value as UserRole
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      {(['Citizen', 'Community Admin', 'Resolver', 'Authority'] as UserRole[]).map((r) => (
                        <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Developer Sandbox Options */}
              <div className="space-y-3 pt-4">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    Developer Sandbox Options
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Restore or wipe the testing database to factory mock values. This populates all cities with diverse complaints, notifications, private space approvals, and duplicate issues.</p>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl max-w-md space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-450 mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-normal">
                      Resetting clears all custom documents across all collections (Users, Issues, Comments, Notifications, Feed Posts) and seeds 11 pre-configured issues across 5 cities, duplicates, and join requests.
                    </span>
                  </div>

                  <button
                    onClick={handleResetSandbox}
                    disabled={resetLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white font-bold text-xs rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 border-0"
                  >
                    {resetLoading ? 'Clearing & Seeding Database...' : 'Reset & Seed Sandbox Database'}
                  </button>
                </div>

                {/* Testing Role Switcher */}
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl max-w-md space-y-3">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] text-slate-650 dark:text-slate-350 leading-normal">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Sandbox Role Switcher</span>
                      Select a role below to change your account permissions immediately. Currently active: <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">{user.role}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {(['Citizen', 'Community Admin', 'Resolver', 'Authority'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={async () => {
                          if (onRoleChange) {
                            await onRoleChange(r);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all cursor-pointer ${
                          user.role === r
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Demo Accounts Credentials */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md space-y-3">
                  <div className="text-[10px] text-slate-655 dark:text-slate-350 leading-normal space-y-1.5">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[9px] text-indigo-600 dark:text-indigo-400">
                      🔑 Preset Hackathon Credentials
                    </span>
                    <p>You can use these accounts to sign in on different windows, browsers, or devices to test multiple roles simultaneously (Password: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-slate-700 dark:text-slate-300">password123</code>):</p>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[9px] text-slate-500 dark:text-slate-400">
                      <li>Citizen: <strong className="text-slate-700 dark:text-slate-300">citizen@communityhero.net</strong></li>
                      <li>Admin: <strong className="text-slate-700 dark:text-slate-300">admin@communityhero.net</strong></li>
                      <li>Resolver: <strong className="text-slate-700 dark:text-slate-300">resolver@communityhero.net</strong></li>
                      <li>Authority: <strong className="text-slate-700 dark:text-slate-300">authority@communityhero.net</strong></li>
                    </ul>
                  </div>
                </div>

                {/* Firestore Cache Troubleshooter */}
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl max-w-md space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] text-slate-650 dark:text-slate-300 leading-normal space-y-1">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">Firestore Cache Troubleshooter</p>
                      <p>If your added reports disappear on reload or you encounter <code>resource-exhausted</code> errors, your browser's persistent offline queue has clogged writes.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {localStorage.getItem('disable_firestore_cache') === 'true' ? (
                      <button
                        onClick={() => {
                          localStorage.setItem('disable_firestore_cache', 'false');
                          window.location.reload();
                        }}
                        className="px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer border-0"
                      >
                        Re-Enable Offline Cache
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (window.confirm("This will purge all queued offline writes in this browser and bypass offline persistence to unblock database sync. Proceed?")) {
                            localStorage.setItem('disable_firestore_cache', 'true');
                            const { purgeFirestoreCache } = await import('../../../services/firebase/firebaseClient');
                            await purgeFirestoreCache();
                            window.location.reload();
                          }
                        }}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer border-0"
                      >
                        Bypass Cache & Clear Queue
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ROLES GUIDE */}
          {activeSettingsTab === 'roles' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-205 uppercase tracking-wider">Civic Roles & Rules Guide</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 leading-normal font-medium">Learn about the different roles, responsibilities, and gamification ranks on the Community Hero platform.</p>
              </div>

              <div className="space-y-6 text-slate-700 dark:text-slate-350 text-xs">
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    How the Platform Runs
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                    Community Hero operates as a collaborative civic network. Citizens log and verify Hyperlocal complaints, resolvers inspect and execute fixes, and Admins and Authorities coordinate city resources and launch civic quests. By working together, the community resolves local issues and tracks municipal health.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-white dark:bg-slate-900">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Citizen
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs mt-1">Eyes on the Street</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                      Reports community hazards, uploads issue photos, supports neighbor complaints to bump urgency, and casts votes to verify nearby issues.
                    </p>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Rewards: +100 XP (Report), +15 XP (Verify), +10 XP (Support)
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-white dark:bg-slate-900">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400">
                      Resolver
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs mt-1">Action & Resolutions</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                      Claims open issues, flags status changes to "In Progress", writes transparent resolution logs, and uploads photographic proof of completed fixes.
                    </p>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold">
                      Rewards: +150 XP per resolved issue
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-white dark:bg-slate-900">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                      Community Admin
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs mt-1">Coordinators & Managers</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                      Oversees specific hubs (like Housing Societies or Wards), handles pending member approval requests, assigns resolving technicians, and launches community challenges.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-white dark:bg-slate-900">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">
                      Authority
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs mt-1">Official Oversight</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                      Governs ward jurisdictions, officially verifies community complaints, and publishes city-wide Weekly or Daily quests on the Challenges Hub.
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-white dark:bg-slate-900">
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">Civic Levels & XP Guide</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium font-sans">Your civic standing evolves dynamically as you gain Reputation XP. Earn points by taking actions on reports:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center pt-1 font-mono text-[9px]">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 1 (0+ XP)</span>
                      <span className="text-slate-400">Citizen</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 2 (100+ XP)</span>
                      <span className="text-teal-600 dark:text-teal-400">Reporter</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 3 (200+ XP)</span>
                      <span className="text-emerald-600 dark:text-emerald-450">Helper</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 4 (400+ XP)</span>
                      <span className="text-blue-600 dark:text-blue-400">Contributor</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 5 (600+ XP)</span>
                      <span className="text-amber-600 dark:text-amber-400">Civic Hero</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 6 (900+ XP)</span>
                      <span className="text-indigo-600 dark:text-indigo-400">Champion</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 7 (1200+ XP)</span>
                      <span className="text-purple-650 dark:text-purple-400">Guardian</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950/20 rounded border border-slate-100 dark:border-slate-800">
                      <span className="block font-black text-slate-900 dark:text-slate-100">Level 8 (1500+ XP)</span>
                      <span className="text-rose-650 dark:text-rose-455">Legend</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
