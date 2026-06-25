import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase/firebaseClient';
import { UserRole } from '../../../types';
import { X, Shield, Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, defaultRole = 'Citizen', onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if user profile exists in Firestore (gracefully caught if rules prevent read/write)
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          const newUserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Civic Hero',
            email: firebaseUser.email || '',
            photoUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.uid)}`,
            role: role, // Default chosen role
            joinedCommunities: ['comm_1'], // Join default community
            reputationScore: 100,
            points: 100,
            reportsCreated: 0,
            reportsVerified: 0,
            reportsResolved: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUserProfile);
        }
      } catch (profileErr) {
        console.warn('Firestore user profile setup bypassed (falling back to local memory simulation):', profileErr);
      }
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const errorCode = err.code;
      if (errorCode === 'auth/operation-not-allowed') {
        setError(
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Google Sign-In is not enabled yet in the Firebase Console.</p>
            <p className="text-[10px] text-slate-600">
              To enable: Go to Firebase Console &gt; Build &gt; Authentication &gt; Sign-in method &gt; Enable "Google" provider.
            </p>
          </div>
        );
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError(
          <div className="space-y-1 text-left">
            <p className="font-bold text-red-800">Unauthorized Domain for Google Login.</p>
            <p className="text-[11px] text-slate-700 leading-normal">
              1. If your browser URL is <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600 font-mono">http://127.0.0.1:5173</code>, try using <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-600 font-mono">http://localhost:5173</code> instead.
            </p>
            <p className="text-[11px] text-slate-700 leading-normal">
              2. Otherwise, go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains and add your current host (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{window.location.hostname}</code>).
            </p>
          </div>
        );
      } else if (errorCode === 'auth/popup-blocked') {
        setError(
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Popup Blocked.</p>
            <p className="text-[11px] text-slate-600">
              Your browser blocked the Google Sign-In popup. Please allow popups for this site and try again.
            </p>
          </div>
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setError('The Google Sign-In popup was closed before authentication finished.');
      } else if (errorCode === 'auth/web-storage-unsupported') {
        setError(
          <div className="space-y-1 text-left">
            <p className="font-bold text-slate-800">Storage / Cookies Blocked.</p>
            <p className="text-[11px] text-slate-600 leading-normal">
              Your browser is blocking access to local storage/third-party cookies (e.g. Brave Shields, Incognito Mode).
            </p>
            <p className="text-[11px] text-slate-600 leading-normal">
              Please allow third-party cookies or try the <strong>Instant Sandbox Session (1-Click)</strong> below.
            </p>
          </div>
        );
      } else {
        setError(
          <div className="space-y-1 text-left">
            <p className="font-bold text-slate-800">Google Authentication Failed</p>
            <p className="text-[11px] text-slate-600 leading-normal">{err.message || 'An unknown error occurred.'}</p>
            <p className="text-[10px] text-slate-500 font-mono">Code: {errorCode || 'unknown'}</p>
          </div>
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Create user document in Firestore (gracefully caught if rules prevent write)
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const newUserProfile = {
            id: firebaseUser.uid,
            name: name.trim(),
            email: firebaseUser.email || '',
            photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            role: role,
            joinedCommunities: ['comm_1'], // Join default community "Green Park Society"
            reputationScore: 100,
            points: 100,
            reportsCreated: 0,
            reportsVerified: 0,
            reportsResolved: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUserProfile);
        } catch (profileErr) {
          console.warn('Firestore sign-up profile setup bypassed (falling back to local memory simulation):', profileErr);
        }
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Verify if document exists; if not (e.g. social auth or missing doc), create basic profile
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            const defaultProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || email.split('@')[0],
              email: firebaseUser.email || '',
              photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
              role: 'Citizen' as UserRole,
              joinedCommunities: ['comm_1'],
              reputationScore: 100,
              points: 100,
              reportsCreated: 0,
              reportsVerified: 0,
              reportsResolved: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userDocRef, defaultProfile);
          }
        } catch (profileErr) {
          console.warn('Firestore sign-in profile setup bypassed (falling back to local memory simulation):', profileErr);
        }
      }
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let friendlyMessage: React.ReactNode = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = (
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Email/Password Sign-In is not enabled yet in your Firebase Console.</p>
            <p className="mt-1">Since AI Studio's 1-click database setup enables <strong>Google Sign-In</strong> by default, please try Google Sign-In instead!</p>
            <div className="mt-2 text-[10px] text-red-700 bg-red-100/50 p-2 rounded leading-normal border border-red-200/40">
              <strong>To enable email sign-in:</strong> Go to Firebase Console &gt; Build &gt; Authentication &gt; Sign-in method &gt; Enable the <strong>Email/Password</strong> provider.
            </div>
          </div>
        );
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxAccess = async () => {
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      // Seed anonymous user in Firestore (gracefully caught if rules prevent read/write)
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          const randomId = Math.floor(1000 + Math.random() * 9000);
          const sandboxName = `Hero #${randomId}`;
          const sandboxProfile = {
            id: firebaseUser.uid,
            name: sandboxName,
            email: 'sandbox@communityhero.net',
            photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sandboxName)}`,
            role: role, // Use selected role or default
            joinedCommunities: ['comm_1', 'comm_2'],
            reputationScore: 150,
            points: 150,
            reportsCreated: 0,
            reportsVerified: 0,
            reportsResolved: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(userDocRef, sandboxProfile);
        }
      } catch (profileErr) {
        console.warn('Firestore sandbox profile setup bypassed (falling back to local memory simulation):', profileErr);
      }
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let friendlyMessage: React.ReactNode = 'Failed to enter sandbox mode. Please try email or Google sign-in.';
      if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = (
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Anonymous Auth is not enabled yet in your Firebase Console.</p>
            <p className="mt-1">Since AI Studio's 1-click setup enables <strong>Google Sign-In</strong> by default, please use the <strong>Continue with Google</strong> button above!</p>
            <div className="mt-2 text-[10px] text-red-700 bg-red-100/50 p-2 rounded leading-normal border border-red-200/40">
              <strong>To enable anonymous access:</strong> Go to Firebase Console &gt; Build &gt; Authentication &gt; Sign-in method &gt; Enable <strong>Anonymous</strong>.
            </div>
          </div>
        );
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
      >
        {/* Header decoration banner */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-500 w-full" />

        <div className="p-6 sm:p-8">
          <button 
            id="auth-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo & Subtitle */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl mb-3 border border-emerald-100">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">
              {isSignUp ? 'Create your Civic Account' : 'Sign In to Community Hero'}
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {isSignUp ? 'Join your neighbors to report & resolve issues' : 'Access your civic workspace console'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200/50 rounded-xl flex items-start space-x-2 text-red-700 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In (Primary Out-of-the-box working method) */}
          <button
            id="auth-google-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono tracking-wider uppercase">
              <span className="bg-white px-3 text-slate-400">or use email / sandbox</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    id="auth-input-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  id="auth-input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  id="auth-input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Role selection card deck */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Civic Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Citizen', 'Community Admin', 'Resolver', 'Authority'] as UserRole[]).map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => setRole(roleOption)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                      role === roleOption 
                        ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 ring-2 ring-emerald-500/10' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{roleOption}</span>
                    <span className="text-[9px] text-slate-400 font-normal mt-0.5">
                      {roleOption === 'Citizen' && 'Report & Verify'}
                      {roleOption === 'Community Admin' && 'Manage & Assign'}
                      {roleOption === 'Resolver' && 'Inspect & Solve'}
                      {roleOption === 'Authority' && 'Governance & Audits'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Civic Account' : 'Sign In Now'}</span>
            </button>
          </form>

          {/* Toggle signup/signin */}
          <div className="mt-4 text-center">
            <button
              id="auth-toggle-mode"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono tracking-wider uppercase">
              <span className="bg-white px-3 text-slate-400">Sandbox Trial</span>
            </div>
          </div>

          {/* Instant Sandbox Access Button */}
          <button
            id="auth-sandbox-btn"
            type="button"
            disabled={loading}
            onClick={handleSandboxAccess}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
            <span>Instant Sandbox Session (1-Click)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
