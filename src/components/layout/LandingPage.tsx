import React from 'react';
import { motion } from 'motion/react';
import { Shield, MapPin, AlertTriangle, ArrowRight, Award, Users, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onStart: (role?: string) => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <Shield className="w-6 h-6" id="logo-icon" />
            </div>
            <div>
              <span className="font-sans font-bold text-xl tracking-tight text-slate-900">Community Hero</span>
              <span className="block text-[10px] font-mono text-emerald-600 font-medium tracking-widest uppercase">Civic AI Command</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              id="nav-enter-citizen"
              onClick={() => onStart('Citizen')} 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Sign In
            </button>
            <button 
              id="nav-get-started"
              onClick={() => onStart('Citizen')} 
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative px-6 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Ambient background blur */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6 text-emerald-800 text-xs font-semibold"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI-Powered Civic Command Center</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-sans font-extrabold tracking-tight text-slate-900 mb-6 leading-tight"
            >
              Empower Your Neighborhood.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Solve Local Problems Together.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Community Hero is a hyperlocal civic governance platform. Report potholes, waste, or faulty lighting. Let Gemini AI analyze the issue immediately, and work with your neighbors and admins to verify and resolve it transparently.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button 
                id="hero-start-citizen"
                onClick={() => onStart('Citizen')} 
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <span>Enter as Citizen</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                id="hero-start-admin"
                onClick={() => onStart('Community Admin')} 
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                <span>Admin & Authority Dashboard</span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-6 py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-4">Core Civic Workflow</h2>
              <p className="text-slate-600 text-sm md:text-base">A transparent, community-authoritative process from detection to verified resolution.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full" id="workflow-card-1">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">1. Report Locally</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Citizens snap a photo of an issue and select their community space (society, ward, or street). Geolocation is automatically logged.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full" id="workflow-card-2">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">2. AI Diagnosis</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Gemini AI analyzes the image, checks for nearby duplicates, assesses severity risk, and routes it to the suggested service department.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full" id="workflow-card-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">3. Vote & Verify</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Neighbors confirm the issue is real, flag fakes, or sign up as supporters. This dynamic voting improves the issue trust score.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full" id="workflow-card-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-6">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">4. Verified Resolution</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Admins assign a resolver, update status progress, upload resolution proof photos, and increase community health points.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gamification pitch */}
        <section className="px-6 py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest font-mono">Civic Gamification</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Reputation Matters.<br />
                Build a Stronger Community.
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Earn points and climb the citizen leaderboard by filing valid reports, verifying nearby issues, or coordinating repair efforts. Every community space maintains a dynamic **Community Health Score** based on active issues, resolution speed, and report accuracy.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>+100 Points for successful verified issue resolutions</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Interactive leaderboard showcasing topmost civic champions</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Monthly AI locality insight report summarizing neighborhood health</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full pointer-events-none" />
              <h4 className="font-bold text-slate-900 text-lg mb-4">Sample Champion Card</h4>
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" 
                  alt="Avatar" 
                  className="w-14 h-14 rounded-full border-2 border-emerald-500 object-cover"
                />
                <div>
                  <h5 className="font-bold text-slate-900">Akshay Dhongade</h5>
                  <p className="text-xs text-slate-500">Green Park Society • Member since Jan</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-xl font-bold text-emerald-600">1,250</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Reputation</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-xl font-bold text-slate-900">12</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Reports</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-xl font-bold text-slate-900">34</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-center text-sm">
        <p>© 2026 Community Hero. Built for Google AI Studio Civic Hackathon.</p>
        <p className="mt-2 text-xs text-slate-600">All data is kept in-memory for preview purposes. Phase 2 UI Demonstration.</p>
      </footer>
    </div>
  );
}
