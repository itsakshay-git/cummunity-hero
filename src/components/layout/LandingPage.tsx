import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, MapPin, AlertTriangle, ArrowRight, Award, Users, 
  CheckCircle2, Flame, ThumbsUp, MessageSquare, Sparkles,
  ShieldCheck, Cpu, Database, Eye
} from 'lucide-react';

interface LandingPageProps {
  onStart: (role?: string) => void;
}

const mockActivityFeed = [
  {
    id: 1,
    name: "Akshay Dhongade",
    role: "Community Admin",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80",
    badge: "Civic Champion",
    community: "Green Park Society",
    action: "verified a critical issue",
    issue: "Water Pipeline Leakage on Main Road",
    votes: 28,
    comments: 5,
    status: "IN_PROGRESS",
    statusText: "Under Repair",
    time: "2m ago"
  },
  {
    id: 2,
    name: "Dr. Suresh Mehta",
    role: "Authority",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80",
    badge: "Official Ward Comm.",
    community: "Ward 12 Civic Forum",
    action: "published a weekly quest",
    issue: "Hyperlocal Drainage Sweep & De-clogging Campaign",
    votes: 42,
    comments: 11,
    status: "QUEST",
    statusText: "Quest Active",
    time: "12m ago"
  },
  {
    id: 3,
    name: "Sneha Rao",
    role: "Citizen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80",
    badge: "Cleanliness Champ",
    community: "Nehru Nagar Block",
    action: "resolved complaint",
    issue: "Unchecked Waste Heap near Central Park",
    votes: 19,
    comments: 2,
    status: "RESOLVED",
    statusText: "Fixed",
    time: "45m ago"
  }
];

// Role data now carries its portrait artwork alongside the existing copy.
// Logic (onStart calls, routing, etc.) is untouched — this only adds `image`.
const roleData = [
  {
    key: "Citizen",
    label: "Citizen",
    image: "/roles/Citizen.png",
    title: "The Eyes on the Street",
    description:
      "Reports local hazards (potholes, garbage, water leaks), votes to verify neighbor reports, registers as supporters, and completes daily quest cards.",
    reward: "⚡ +100 XP (Report) · +15 XP (Verify)",
    accent: "emerald",
  },
  {
    key: "Resolver",
    label: "Resolver",
    image: "/roles/Resolver.png",
    title: "The Hands of Resolution",
    description:
      "Assigned by admins to execute repairs, claims open community reports, posts status updates, and uploads visual proof of completed fixes.",
    reward: "🛠️ +150 XP per resolved issue",
    accent: "indigo",
  },
  {
    key: "Community Admin",
    label: "Community Admin",
    image: "/roles/Community Admin.png",
    title: "Space Coordinators",
    description:
      "Manages localized private spaces, approves pending membership join requests, assigns resolvers, and organizes community challenges.",
    reward: "📌 Launches community quests",
    accent: "amber",
  },
  {
    key: "Authority",
    label: "Authority",
    image: "/roles/Authority.png",
    title: "Official Overseers",
    description:
      "Verifies issues as \"Officially Confirmed\", coordinates public department budgets, and creates city-wide daily/weekly Civic Hub campaigns.",
    reward: "🏛️ Launches city-wide quests",
    accent: "rose",
  },
] as const;

// Tailwind class lookups keyed by accent so we avoid building dynamic
// class strings (which Tailwind can't statically extract / purge).
const accentStyles = {
  emerald: {
    glowFrom: "from-emerald-500/30",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/30",
    rewardBg: "bg-emerald-500/5",
    rewardBorder: "border-emerald-500/10",
    rewardText: "text-emerald-400",
    cardBorder: "hover:border-emerald-500/40",
    shadow: "hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.35)]",
    textHover: "group-hover:text-emerald-400",
  },
  indigo: {
    glowFrom: "from-indigo-500/30",
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-400",
    badgeBorder: "border-indigo-500/30",
    rewardBg: "bg-indigo-500/5",
    rewardBorder: "border-indigo-500/10",
    rewardText: "text-indigo-400",
    cardBorder: "hover:border-indigo-500/40",
    shadow: "hover:shadow-[0_20px_50px_-15px_rgba(99,102,241,0.35)]",
    textHover: "group-hover:text-indigo-400",
  },
  amber: {
    glowFrom: "from-amber-500/30",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/30",
    rewardBg: "bg-amber-500/5",
    rewardBorder: "border-amber-500/10",
    rewardText: "text-amber-400",
    cardBorder: "hover:border-amber-500/40",
    shadow: "hover:shadow-[0_20px_50px_-15px_rgba(245,158,11,0.35)]",
    textHover: "group-hover:text-amber-400",
  },
  rose: {
    glowFrom: "from-rose-500/30",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-400",
    badgeBorder: "border-rose-500/30",
    rewardBg: "bg-rose-500/5",
    rewardBorder: "border-rose-500/10",
    rewardText: "text-rose-400",
    cardBorder: "hover:border-rose-500/40",
    shadow: "hover:shadow-[0_20px_50px_-15px_rgba(244,63,94,0.35)]",
    textHover: "group-hover:text-rose-400",
  },
} as const;

export default function LandingPage({ onStart }: LandingPageProps) {
  const [activePreviewPost, setActivePreviewPost] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white overflow-hidden relative">
      
      {/* Glow mesh backdrops */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10 opacity-70" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              {/* <Shield className="w-5 h-5" /> */}
              <img className="w-6 h-6" src={"community_hero_logo.png"} alt="Community Hero Logo" />
            </div>
            <div>
              <span className="font-sans font-black text-lg tracking-tight text-white block">Community Hero</span>
              <span className="block text-[8px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase mt-0.5">Social Civic Hub</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              id="nav-enter-citizen"
              onClick={() => onStart('Citizen')} 
              className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-0"
            >
              Sign In
            </button>
            <button 
              id="nav-get-started"
              onClick={() => onStart('Citizen')} 
              className="hidden sm:block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        
        {/* Two-Column Hero Section */}
        <section className="relative px-6 pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Copywriting & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/20 rounded-full px-3.5 py-1.5 text-emerald-400 text-[10px] font-bold tracking-wide uppercase"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>The Social Network for City Governance</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-sans font-black tracking-tight text-white leading-tight"
              >
                Connect. Report.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">Transform Your City.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
              >
                Tired of filing reports that disappear into government black holes? Community Hero turns city management into a collaborative, social ecosystem. Report local complaints, watch Gemini AI route them automatically, support your neighbors, and build a verified civic honor roll.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <button 
                  id="hero-start-citizen"
                  onClick={() => onStart('Citizen')} 
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_25px_rgba(16,185,129,0.35)] flex items-center justify-center space-x-2 group cursor-pointer hover:scale-105 active:scale-95 border-0 text-xs uppercase tracking-wider"
                >
                  <span>Join the Civic Network</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  id="hero-start-admin"
                  onClick={() => onStart('Community Admin')} 
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold border border-slate-800 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 text-xs uppercase tracking-wider"
                >
                  <span>Official Authority Login</span>
                </button>
              </motion.div>
            </div>

            {/* Right Column: Interactive Social Feed Preview */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden flex flex-col space-y-4">
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 tracking-wider">CHANDRAPUR FEED PREVIEW</span>
                  <Flame className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {mockActivityFeed.map((post, idx) => (
                    <button
                      key={post.id}
                      onClick={() => setActivePreviewPost(idx)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                        activePreviewPost === idx
                          ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:bg-slate-950/40'
                      }`}
                    >
                      {post.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="h-56 relative flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {mockActivityFeed.map((post, idx) => {
                      if (idx !== activePreviewPost) return null;
                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-colors shadow-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2.5">
                              <img 
                                src={post.avatar} 
                                alt={post.name} 
                                className="w-9 h-9 rounded-xl object-cover border border-slate-800"
                              />
                              <div>
                                <span className="font-extrabold text-[11px] text-white block leading-tight">{post.name}</span>
                                <span className="text-[9px] text-emerald-400 font-bold tracking-wide">{post.badge} • {post.community}</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500">{post.time}</span>
                          </div>

                          <div className="space-y-1 my-2">
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{post.action}</span>
                            <p className="text-[11px] text-slate-300 font-semibold leading-tight line-clamp-2">
                              {post.issue}
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-900">
                            <div className="flex space-x-3 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center space-x-1 hover:text-emerald-400 transition-colors cursor-pointer">
                                <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{post.votes}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                <span>{post.comments}</span>
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                              post.status === 'RESOLVED' 
                                ? 'bg-green-600/10 text-green-400 border border-green-500/20'
                                : post.status === 'QUEST'
                                ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {post.statusText}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <div className="text-[9px] text-slate-500 text-center leading-normal pt-1 flex items-center justify-center space-x-1.5 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Interactive simulation. Real reports sync live with authorities.</span>
                </div>

              </div>
            </motion.div>

          </div>
        </section>

        {/* Section 2: Choose Your Civic Path — character-select style role cards */}
        <section className="px-6 py-20 bg-slate-900/20 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono">Civic Ecosystem</span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1 mb-4">Choose Your Civic Path</h2>
              <p className="text-slate-400 text-xs md:text-sm font-medium">Four customized roles work in collaboration to build robust neighborhood workspaces.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roleData.map((role, idx) => {
                const styles = accentStyles[role.accent];
                return (
                  <motion.div
                    key={role.key}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.45, delay: idx * 0.08 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative rounded-2xl bg-slate-900/40 border border-slate-800 transition-colors duration-300 overflow-hidden cursor-pointer ${styles.cardBorder} ${styles.shadow}`}
                  >
                    {/* Large portrait panel — the visual anchor of the card */}
                    <div className="relative h-48 overflow-hidden bg-slate-950">
                      <motion.img
                        src={role.image}
                        alt={`${role.label} role illustration`}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ scale: 1.08 }}
                        whileHover={{ scale: 1.16 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      {/* Gradient wash so the badge + bottom edge stay legible over any artwork */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${styles.glowFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay`} />

                      {/* Role badge sits on the artwork, top-left, game-HUD style */}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[8px] font-extrabold uppercase font-mono tracking-wider backdrop-blur-sm border ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}>
                        {role.label}
                      </span>

                      {/* Title overlaps the image/content boundary for a layered feel */}
                      <h4 className="absolute bottom-3 left-4 right-4 font-extrabold text-base text-white leading-tight drop-shadow-md">
                        {role.title}
                      </h4>
                    </div>

                    {/* Copy + reward */}
                    <div className="p-5 space-y-4">
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        {role.description}
                      </p>
                      <div className={`flex items-center justify-between text-[9px] font-mono font-bold px-3 py-2 rounded-lg border ${styles.rewardBg} ${styles.rewardBorder} ${styles.rewardText}`}>
                        <span>{role.reward}</span>
                        <ArrowRight className={`w-3.5 h-3.5 text-slate-600 ${styles.textHover} group-hover:translate-x-0.5 transition-all`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Gemini AI Command Center (Creative AI Features breakdown) */}
        <section className="px-6 py-20 bg-slate-950 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side: AI Banner Graphics */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm aspect-[4/3] bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-300 font-bold">GEMINI COGNITIVE ENGINE</span>
                  </div>
                  <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black">ACTIVE</span>
                </div>

                <div className="space-y-4 my-4 font-mono text-[9px] text-slate-400 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                    <span>Analyzing Image... recognized: <code className="bg-slate-950 px-1 py-0.5 text-white rounded">Pothole</code> (98% confidence)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Database className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                    <span>Geo-Query Duplicates Check... found 0 matching open issues within 20m.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Eye className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                    <span>Assigning severity index score: <code className="bg-slate-950 px-1 py-0.5 text-amber-400 rounded">Medium (Risk: 3/5)</code></span>
                  </div>
                </div>

                <div className="text-[8px] text-center text-slate-500 font-medium">
                  Automatically processes reports for instant dispatching.
                </div>
              </div>
            </div>

            {/* Right side: AI Features description */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono">Cognitive Tech</span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Gemini AI Command Center</h2>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">
                Our embedded Gemini AI service processes all hyperlocal complaint reports directly on ingest to ensure data cleanliness and speed up resolutions:
              </p>

              <div className="space-y-4 font-sans text-xs">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 rounded-xl mt-1">
                    <Cpu className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Computer Vision Categorization</h5>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Gemini analyzes uploaded issue photographs to automatically identify the complaint category (Garbage, Pothole, Streetlight, Drainage, Water Leakage).</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2 bg-teal-950/50 border border-teal-500/20 text-teal-400 rounded-xl mt-1">
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Automated Duplicate Prevention</h5>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Compares coordinate proximities and categories to flag repeats, merging duplicate reports into single master posts to prevent community spam.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2 bg-indigo-950/50 border border-indigo-500/20 text-indigo-400 rounded-xl mt-1">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Urgency Scoring & Dispatching</h5>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Scores hazard threats based on descriptive factors, automatically suggesting ward divisions and notifying local resolver teams for fast dispatching.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-6 py-16 bg-slate-900/10 border-t border-slate-900 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono">The Civic Engine</span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1 mb-4">Core Civic Workflow</h2>
              <p className="text-slate-400 text-xs md:text-sm font-medium">A transparent, community-authoritative process from detection to verified resolution.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col h-full hover:-translate-y-1.5 hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 cursor-default" id="workflow-card-1">
                <div className="w-11 h-11 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2">1. Report Locally</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Citizens snap a photo of an issue and select their community space (society, ward, or street). Geolocation is automatically logged.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col h-full hover:-translate-y-1.5 hover:shadow-md hover:border-teal-500/20 transition-all duration-300 cursor-default" id="workflow-card-2">
                <div className="w-11 h-11 bg-teal-950/50 text-teal-400 border border-teal-500/20 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2">2. AI Diagnosis</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Gemini AI analyzes the image, checks for nearby duplicates, assesses severity risk, and routes it to the suggested service department.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col h-full hover:-translate-y-1.5 hover:shadow-md hover:border-blue-500/20 transition-all duration-300 cursor-default" id="workflow-card-3">
                <div className="w-11 h-11 bg-blue-950/50 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2">3. Vote & Verify</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Neighbors confirm the issue is real, flag fakes, or sign up as supporters. This dynamic voting improves the issue trust score.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col h-full hover:-translate-y-1.5 hover:shadow-md hover:border-indigo-500/20 transition-all duration-300 cursor-default" id="workflow-card-4">
                <div className="w-11 h-11 bg-indigo-950/50 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2">4. Verified Resolution</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Admins assign a resolver, update status progress, upload resolution proof photos, and increase community health points.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gamification pitch */}
        <section className="px-6 py-20 bg-slate-950 border-t border-slate-900">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
            
            {/* Copywriting */}
            <div className="flex-1 space-y-6">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono">Civic Gamification</span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Reputation Matters.<br />
                Build a Stronger Community.
              </h2>
              <p className="text-slate-400 leading-relaxed text-xs md:text-sm font-medium">
                Earn points and climb the citizen leaderboard by filing valid reports, verifying nearby issues, or coordinating repair efforts. Every community space maintains a dynamic <strong className="text-slate-200 font-bold">Community Health Score</strong> based on active issues, resolution speed, and report accuracy.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium">Earn XP rewards & claim badges for reporting and resolving issues</span>
                </li>
                <li className="flex items-center space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium">Interactive leaderboard showcasing top civic champions</span>
                </li>
                <li className="flex items-center space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium">Monthly AI locality insight report summarizing neighborhood health</span>
                </li>
              </ul>
            </div>

            {/* Interactive Champion Card mockup */}
            <div className="flex-1 bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-md w-full max-w-md relative overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full pointer-events-none" />
              <h4 className="font-bold text-slate-300 text-xs mb-4 uppercase font-mono tracking-wider">Sample Champion Card</h4>
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" 
                  alt="Avatar" 
                  className="w-14 h-14 rounded-xl border-2 border-emerald-500 object-cover"
                />
                <div>
                  <h5 className="font-bold text-white text-sm">Akshay Dhongade</h5>
                  <p className="text-[10px] text-slate-500">Green Park Society • Member since Jan</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="block text-base font-black text-emerald-400">1,250</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Reputation</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="block text-base font-black text-slate-200">12</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Reports</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="block text-base font-black text-slate-200">34</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Verified</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 px-6 border-t border-slate-900 text-center text-xs">
        <p className="font-medium">© 2026 Community Hero. Built for Google AI Studio Civic Hackathon.</p>
        <p className="mt-2 text-[9px] text-slate-700">All data is kept in-memory for preview purposes. Phase 2 UI Demonstration.</p>
      </footer>
    </div>
  );
}