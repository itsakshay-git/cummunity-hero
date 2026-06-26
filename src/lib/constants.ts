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
    address: 'Block C Gate, Green Park Society, Chandrapur',
    department: 'Water Supply Department',
    aiSummary: 'Rupture in high-pressure supply line resulting in clean water pooling and mild soil erosion risks.'
  },
  {
    title: 'Deplorable Street Waste',
    category: 'Garbage' as IssueCategory,
    severity: 'Medium' as SeverityLevel,
    description: 'Rotting food waste, plastic bags, and household garbage piled at the corner of the public vegetable market.',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    address: 'Shivajinagar Vegetable Market Road, Chandrapur',
    department: 'Municipal Waste Management',
    aiSummary: 'Unsegregated organic solid waste dump causing strong foul odors and inviting pest infestation risks.'
  },
  {
    title: 'Critical Pothole on Active Lane',
    category: 'Pothole' as IssueCategory,
    severity: 'Critical' as SeverityLevel,
    description: 'Extremely deep pothole under the metro pillar that fills with rain/muddy water. Vehicles swerve to avoid it.',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    address: 'High Street Lane 4, Chandrapur',
    department: 'Public Works & Pavements',
    aiSummary: 'Deep structural pavement pothole exceeding 5 inches in depth, posing critical risks for motorbikes.'
  }
];

export const COMMUNITY_PRESET_COVERS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', // Modern Buildings / Residential
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80', // College Campus
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80', // City Skyline
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80', // Street / Neighborhood
  'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80', // Green Park / Eco-living
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80', // Office/Civic space
];

export const COMMUNITY_PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=150&h=150&q=80', // Green House
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80', // City Hall
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=150&h=150&q=80', // Graduation Cap
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=150&h=150&q=80', // Hands Joined
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&h=150&q=80', // Office building
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&h=150&q=80', // Teamwork
];

export const CITIES_MAPPING = [
  { city: 'Chandrapur', district: 'Chandrapur', state: 'Maharashtra', label: 'Chandrapur, MH' },
  { city: 'Pune', district: 'Pune', state: 'Maharashtra', label: 'Pune, MH' },
  { city: 'Mumbai', district: 'Mumbai Sub', state: 'Maharashtra', label: 'Mumbai, MH' },
  { city: 'Bangalore', district: 'Bangalore Urban', state: 'Karnataka', label: 'Bangalore, KA' },
  { city: 'Delhi', district: 'New Delhi', state: 'Delhi', label: 'Delhi, NCR' },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', label: 'Chennai, TN' }
];

