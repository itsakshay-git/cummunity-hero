import { 
  Megaphone, UserCheck, ShieldAlert, Building2, CheckCircle2, Sparkles 
} from 'lucide-react';
import { IssueCategory, SeverityLevel } from '../types';

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

export const PRESETS = [
  {
    title: 'Severe Water Leakage',
    category: 'Water Leakage' as IssueCategory,
    severity: 'High' as SeverityLevel,
    description: 'A major underground pipe has ruptured. Water is gushing out onto the street, pooling up near the main society block entrance.',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80',
    address: 'Block C Gate, Green Park Society, Pune',
    department: 'Water Supply Department',
    aiSummary: 'Rupture in high-pressure supply line resulting in clean water pooling and mild soil erosion risks.'
  },
  {
    title: 'Deplorable Street Waste',
    category: 'Garbage' as IssueCategory,
    severity: 'Medium' as SeverityLevel,
    description: 'Rotting food waste, plastic bags, and household garbage piled at the corner of the public vegetable market.',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    address: 'Shivajinagar Vegetable Market Road, Pune',
    department: 'Municipal Waste Management',
    aiSummary: 'Unsegregated organic solid waste dump causing strong foul odors and inviting pest infestation risks.'
  },
  {
    title: 'Critical Pothole on Active Lane',
    category: 'Pothole' as IssueCategory,
    severity: 'Critical' as SeverityLevel,
    description: 'Extremely deep pothole under the metro pillar that fills with rain/muddy water. Vehicles swerve to avoid it.',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    address: 'High Street Lane 4, Pune',
    department: 'Public Works & Pavements',
    aiSummary: 'Deep structural pavement pothole exceeding 5 inches in depth, posing critical risks for motorbikes.'
  }
];
