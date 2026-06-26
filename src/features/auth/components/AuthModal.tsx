import React, { useState, useEffect } from 'react';
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
import { getDistanceMeters } from '../../../lib/geoUtils';
import { CITIES_MAPPING } from '../../../lib/constants';
import { mockUsers } from '../../../lib/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onAuthSuccess: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

const getProfileForUser = (firebaseUser: any, demoEmail?: string, chosenRole?: UserRole, chosenCity?: string) => {
  const emailToUse = demoEmail || firebaseUser.email || '';
  const matchedMock = mockUsers.find(u => u.email.toLowerCase() === emailToUse.toLowerCase());
  if (matchedMock) {
    return {
      ...matchedMock,
      id: firebaseUser.uid
    };
  }
  const cityInfo = CITIES_MAPPING.find(c => c.city === chosenCity) || CITIES_MAPPING[0];
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || demoEmail?.split('@')[0] || 'Civic Hero',
    email: emailToUse,
    photoUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.uid)}`,
    role: chosenRole || 'Citizen',
    joinedCommunities: ['comm_1'],
    reputationScore: 100,
    points: 100,
    reportsCreated: 0,
    reportsVerified: 0,
    reportsResolved: 0,
    city: cityInfo.city,
    district: cityInfo.district,
    state: cityInfo.state,
    location: `${cityInfo.city}, ${cityInfo.state}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export default function AuthModal({ isOpen, onClose, defaultRole = 'Citizen', onAuthSuccess, userCoords }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [selectedCityLabel, setSelectedCityLabel] = useState('Chandrapur');

  useEffect(() => {
    if (userCoords) {
      let closestCity = 'Chandrapur';
      let minDistance = Infinity;
      
      const cityCoords: Record<string, { lat: number; lng: number }> = {
        'Chandrapur': { lat: 19.9615, lng: 79.2961 },
        'Pune': { lat: 18.5204, lng: 73.8567 },
        'Mumbai': { lat: 19.0760, lng: 72.8777 },
        'Bangalore': { lat: 12.9716, lng: 77.5946 },
        'Delhi': { lat: 28.6139, lng: 77.2090 },
        'Chennai': { lat: 13.0827, lng: 80.2707 }
      };

      Object.entries(cityCoords).forEach(([cityName, coords]) => {
        const dist = getDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestCity = cityName;
        }
      });
      setSelectedCityLabel(closestCity);
    } else {
      setSelectedCityLabel('Chandrapur');
    }
  }, [userCoords]);

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
          const newUserProfile = getProfileForUser(firebaseUser, undefined, role, selectedCityLabel);
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
          const newUserProfile = getProfileForUser(firebaseUser, undefined, role, selectedCityLabel);
          newUserProfile.name = name.trim();
          newUserProfile.photoUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
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
            const defaultProfile = getProfileForUser(firebaseUser, undefined, 'Citizen', selectedCityLabel);
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
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-login-credentials'
      ) {
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
          const sandboxProfile = getProfileForUser(firebaseUser, 'sandbox@communityhero.net', role, selectedCityLabel);
          sandboxProfile.name = sandboxName;
          sandboxProfile.photoUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sandboxName)}`;
          sandboxProfile.joinedCommunities = ['comm_1', 'comm_2'];
          sandboxProfile.reputationScore = 150;
          sandboxProfile.points = 155;
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
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
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
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        {/* Header decoration banner */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-500 w-full flex-shrink-0" />

        <div className="p-6 sm:p-8 overflow-y-auto flex-grow scrollbar-thin">
          <button 
            id="auth-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Branding, Quick logins, Sandbox */}
            <div className="space-y-5">
              {/* Logo & Subtitle */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-xl mb-3 border border-emerald-100 dark:border-emerald-900/30 inline-block">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  Community Hero Workspace
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                  Sign in to access your civic workspace console, report issues, and collaborate with your neighborhood.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-xl flex items-start space-x-2 text-red-700 dark:text-red-400 text-xs leading-relaxed animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">{error}</div>
                </div>
              )}

              {/* Google Sign In */}
              <button
                id="auth-google-btn"
                type="button"
                disabled={loading}
                onClick={handleGoogleAuth}
                className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Quick Demo Login Cards */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 block">
                  🔑 Quick Demo Login (1-Click)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: 'Citizen', email: 'citizen@communityhero.net', name: 'Citizen Demo' },
                    { role: 'Community Admin', email: 'admin@communityhero.net', name: 'Admin Demo' },
                    { role: 'Resolver', email: 'resolver@communityhero.net', name: 'Resolver Demo' },
                    { role: 'Authority', email: 'authority@communityhero.net', name: 'Authority Demo' }
                  ].map((demo) => (
                    <button
                      key={demo.role}
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setError(null);
                        setLoading(true);
                        try {
                          let credential;
                          try {
                            credential = await signInWithEmailAndPassword(auth, demo.email, 'password123');
                            
                            // Verify if document exists in Firestore; if not, create it
                            const userDocRef = doc(db, 'users', credential.user.uid);
                            const userDocSnap = await Promise.race([
                              getDoc(userDocRef),
                              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
                            ]).catch(() => null);

                            if (!userDocSnap || !userDocSnap.exists()) {
                              const defaultProfile = getProfileForUser(credential.user, demo.email, demo.role as UserRole, 'Chandrapur');
                              await Promise.race([
                                setDoc(userDocRef, defaultProfile),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
                              ]).catch(err => console.warn('Bypassed user profile seed timeout:', err));
                            }
                          } catch (signInErr: any) {
                            // If user doesn't exist, create account on the fly
                            const code = signInErr.code;
                            if (
                              code === 'auth/user-not-found' || 
                              code === 'auth/invalid-credential' ||
                              code === 'auth/invalid-login-credentials' ||
                              code === 'auth/error-code-generic' ||
                              code === 'auth/invalid-email'
                            ) {
                              credential = await createUserWithEmailAndPassword(auth, demo.email, 'password123');
                              const newUserProfile = getProfileForUser(credential.user, demo.email, demo.role as UserRole, 'Chandrapur');
                              await Promise.race([
                                setDoc(doc(db, 'users', credential.user.uid), newUserProfile),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
                              ]).catch(err => console.warn('Bypassed profile creation seed timeout:', err));
                            } else {
                              throw signInErr;
                            }
                          }
                          onAuthSuccess();
                          onClose();
                        } catch (err: any) {
                          console.error('Demo Login Error:', err);
                          let friendlyMsg: React.ReactNode = err.message || err.toString();
                          if (err.code === 'auth/operation-not-allowed') {
                            friendlyMsg = (
                              <div className="space-y-1.5 text-left">
                                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Email/Password Login is disabled.</p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                                  To use Demo logins, you must enable the <strong>Email/Password</strong> provider in your Firebase Console.
                                </p>
                                <div className="mt-2 text-[9px] text-red-700 bg-red-50 dark:bg-red-950/20 p-2 rounded leading-normal border border-red-200/30">
                                  <strong>How to enable:</strong> Go to Firebase Console &gt; Authentication &gt; Sign-in method &gt; Add new provider &gt; Select <strong>Email/Password</strong> &gt; Enable and Save.
                                </div>
                              </div>
                            );
                          } else if (err.code === 'auth/wrong-password' || err.code === 'auth/email-already-in-use') {
                            friendlyMsg = `The email ${demo.email} already exists in Firebase but with a different password. Please sign in via standard email using the correct password, or delete this user record from your Firebase Console.`;
                          }
                          setError(friendlyMsg);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-extrabold text-left transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold">{demo.role}</span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-505 block mt-0.5 truncate">{demo.email}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-450 dark:text-slate-500 text-center font-medium leading-tight">
                  Password: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[8px] text-slate-700 dark:text-slate-300">password123</code> (Auto-created if clean)
                </p>
              </div>

              {/* Instant Sandbox Session */}
              <button
                id="auth-sandbox-btn"
                type="button"
                disabled={loading}
                onClick={handleSandboxAccess}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                <span>Instant Sandbox Session (1-Click)</span>
              </button>
            </div>

            {/* Right Column: Standard Email Auth Form */}
            <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/80 pt-6 md:pt-0 md:pl-8 space-y-4">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 block md:mt-2">
                ✉️ {isSignUp ? 'Create Civic Account' : 'Standard Email Login'}
              </span>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input 
                        id="auth-input-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-450 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input 
                      id="auth-input-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-450 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input 
                      id="auth-input-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-450 dark:placeholder:text-slate-600"
                    />
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
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
