import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Map, Settings, Shield, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';

export const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export const hasValidKey = Boolean(API_KEY) && API_KEY.trim() !== '' && API_KEY !== 'YOUR_API_KEY';

// Register global gm_authFailure handler to intercept Google Maps authentication/billing issues
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn("Google Maps authentication failure detected (commonly BillingNotEnabledMapError or invalid key).");
    const event = new CustomEvent('gmp-auth-failure');
    window.dispatchEvent(event);
  };
}

interface GoogleMapSectionProps {
  children: React.ReactNode;
  height?: string;
  fallbackMessage?: string;
}

export function GoogleMapSection({ children, height = '400px', fallbackMessage }: GoogleMapSectionProps) {
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const handleFailure = () => {
      setAuthError(true);
    };
    window.addEventListener('gmp-auth-failure', handleFailure);
    return () => {
      window.removeEventListener('gmp-auth-failure', handleFailure);
    };
  }, []);

  if (!hasValidKey) {
    return (
      <div 
        style={{ height }} 
        className="w-full flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden"
      >
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="text-center max-w-md space-y-4 relative z-10 p-4">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 text-emerald-600">
            <Map className="w-6 h-6" />
          </div>
          
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Google Maps API Key Required</h3>
            <p className="text-xs text-slate-500 mt-1">
              {fallbackMessage || "To enable interactive neighborhood maps and location picking, please add your Google Maps API Key."}
            </p>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl p-4 text-left shadow-sm text-xs space-y-2.5 text-slate-600 leading-normal">
            <p className="font-semibold text-slate-800 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-emerald-600" />
              How to add your API Key:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 font-medium text-[11px] text-slate-500">
              <li>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  Get an API Key from Google Cloud console
                </a>
              </li>
              <li>
                Open <strong className="text-slate-700">Settings</strong> (⚙️ gear icon, top-right corner)
              </li>
              <li>
                Select <strong className="text-slate-700">Secrets</strong> from the left menu
              </li>
              <li>
                Type <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">GOOGLE_MAPS_PLATFORM_KEY</code>, press <strong className="text-slate-700">Enter</strong>
              </li>
              <li>
                Paste your API key as the value, press <strong className="text-slate-700">Enter</strong>
              </li>
            </ol>
            <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>The platform will automatically recompile the application - no manual browser refresh is necessary.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div 
        style={{ height }} 
        className="w-full flex items-center justify-center p-6 bg-red-50/50 border border-red-200 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="text-center max-w-md space-y-4 relative z-10 p-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center border border-red-200 text-red-600 animate-pulse">
            <CreditCard className="w-6 h-6" />
          </div>
          
          <div>
            <h3 className="font-bold text-red-900 text-sm">Google Maps: Billing Required</h3>
            <p className="text-xs text-red-600 mt-1 font-semibold">
              BillingNotEnabledMapError
            </p>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Your Google Maps API key is saved successfully, but the Google Cloud project hosting this key does not have billing enabled.
            </p>
          </div>

          <div className="bg-white border border-red-150 rounded-xl p-4 text-left shadow-sm text-xs space-y-2.5 text-slate-600 leading-normal">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
              How to enable billing & activate the map:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 font-medium text-[11px] text-slate-500">
              <li>
                <a 
                  href="https://console.cloud.google.com/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Go to Google Cloud Billing Console
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Select your active project or create a billing account.
              </li>
              <li>
                Link a valid credit card or payment method to the billing profile.
              </li>
              <li>
                Make sure the <strong className="text-slate-700">Maps JavaScript API</strong> is enabled in the APIs dashboard.
              </li>
            </ol>
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              <span>Once billing is linked in Google Cloud Console, Google Maps services will begin rendering here immediately.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      {children}
    </APIProvider>
  );
}
