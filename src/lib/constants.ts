import { 
  Megaphone, UserCheck, ShieldAlert, Building2, CheckCircle2, Sparkles 
} from 'lucide-react';

export const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
];

export const ALL_BADGES = [
  { 
    id: 'first_rep', 
    name: 'First Report', 
    icon: Megaphone, 
    desc: 'Logged first public incident', 
    color: 'bg-teal-500 text-white border-teal-200' 
  },
  { 
    id: 'top_verifier', 
    name: 'Top Verifier', 
    icon: UserCheck, 
    desc: 'Verified 10+ neighbor issues', 
    color: 'bg-emerald-500 text-white border-emerald-200' 
  },
  { 
    id: 'road_guard', 
    name: 'Road Guardian', 
    icon: ShieldAlert, 
    desc: 'Logged 3+ road/pothole issues', 
    color: 'bg-amber-500 text-white border-amber-200' 
  },
  { 
    id: 'comm_builder', 
    name: 'Community Builder', 
    icon: Building2, 
    desc: 'Active in multiple space hubs', 
    color: 'bg-indigo-500 text-white border-indigo-200' 
  },
  { 
    id: 'prob_solver', 
    name: 'Problem Solver', 
    icon: CheckCircle2, 
    desc: 'Coordinated a resolved issue', 
    color: 'bg-purple-500 text-white border-purple-200' 
  },
  { 
    id: 'civic_hero', 
    name: 'Civic Hero', 
    icon: Sparkles, 
    desc: 'Reached 600+ Reputation XP', 
    color: 'bg-rose-500 text-white border-rose-200' 
  },
];
