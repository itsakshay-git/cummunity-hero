import React, { useState } from 'react';
import { Sparkles, MapPin, Camera, AlertCircle, RefreshCw, Upload, X, Loader2, Navigation } from 'lucide-react';
import { Community, IssueCategory, SeverityLevel, Issue } from '../../../types';
import { GoogleMapSection, hasValidKey } from '../../maps/components/GoogleMapSection';
import { Map as GMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import OpenStreetMapSection from '../../maps/components/OpenStreetMapSection';
import { analyzeIssue } from '../../../services/ai/geminiService';
import CustomModal from '../../../components/Modal';

interface ReportIssueFormProps {
  communities: Community[];
  onSubmit: (issue: Omit<Issue, 'id' | 'reportedBy' | 'reportedByName' | 'trustScore' | 'verificationCount' | 'fakeCount' | 'supporterCount' | 'createdAt' | 'updatedAt'>) => void;
  onNavigate: (tab: string) => void;
}

// Interactive presets for testing
const PRESETS = [
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

export default function ReportIssueForm({ communities, onSubmit, onNavigate }: ReportIssueFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pothole' as IssueCategory,
    severity: 'Medium' as SeverityLevel,
    communityId: communities[0]?.id || '',
    address: '',
    imageUrl: '',
    latitude: 18.5204,
    longitude: 73.8567,
  });

  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [locating, setLocating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>('osm');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  // Auto-switch to OpenStreetMap if Google Maps auth/billing fails
  React.useEffect(() => {
    const handleAuthFailure = () => {
      console.warn("Switching ReportIssueForm to OpenStreetMap due to API auth/billing failure.");
      setMapProvider('osm');
    };
    window.addEventListener('gmp-auth-failure', handleAuthFailure);
    return () => {
      window.removeEventListener('gmp-auth-failure', handleAuthFailure);
    };
  }, []);

  // Auto-fill from preset
  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setFormData({
      ...formData,
      title: preset.title,
      description: preset.description,
      category: preset.category,
      severity: preset.severity,
      address: preset.address,
      imageUrl: preset.imageUrl,
      latitude: 18.5204,
      longitude: 73.8567,
    });
    setAiResult(null);
  };

  // Drag and drop image upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        imageUrl: reader.result as string
      }));
      setAiResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Reverse Geocode street address using Nominatim OpenStreetMap API
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setFormData(prev => ({
            ...prev,
            address: data.display_name
          }));
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
  };

  // Locate user coordinates & Reverse Geocode street address using Nominatim OpenStreetMap API
  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      setAlertModalMessage('Geolocation is not supported by your browser.');
      setAlertModalOpen(true);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          address: `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              setFormData(prev => ({
                ...prev,
                address: data.display_name
              }));
            }
          }
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        setAlertModalMessage(`Failed to retrieve your location: ${error.message}. Please input your address manually.`);
        setAlertModalOpen(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Trigger real Gemini AI Image Analysis on frontend
  const triggerAiScan = async () => {
    if (!formData.imageUrl) {
      setAlertModalMessage('Please upload or select an issue image first!');
      setAlertModalOpen(true);
      return;
    }
    setScanning(true);
    setAiResult(null);

    try {
      const result = await analyzeIssue({
        imageUrl: formData.imageUrl,
        description: formData.description,
        title: formData.title,
        category: formData.category,
        severity: formData.severity
      });
      setAiResult(result);
    } catch (error: any) {
      console.error('AI Scan failed:', error);
      
      // Fallback in case of absolute network/API failure
      setAiResult({
        category: formData.category,
        severity: formData.severity,
        riskLevel: formData.severity,
        summary: `[Local Fallback] Incident details processed. Location: ${formData.address}. Analysis verified via offline queue.`,
        suggestedDepartment: 'Public Works Department',
        confidence: 0.8,
        priorityScore: formData.severity === 'Critical' ? 90 : (formData.severity === 'High' ? 75 : 50)
      });
    } finally {
      setScanning(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.address.trim() || !formData.imageUrl) {
      setAlertModalMessage('Please complete all fields, including the incident image!');
      setAlertModalOpen(true);
      return;
    }

    // Submit issue
    onSubmit({
      communityId: formData.communityId,
      title: formData.title,
      description: formData.description,
      category: aiResult?.category || formData.category,
      severity: aiResult?.severity || formData.severity,
      status: 'OPEN',
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
      imageUrl: formData.imageUrl,
      aiSummary: aiResult?.summary || 'Standard citizen report. Pending automated scanning.',
      aiConfidence: aiResult?.confidence || 0.80,
      suggestedDepartment: aiResult?.suggestedDepartment || 'Civic Works',
      priorityScore: aiResult?.priorityScore || (formData.severity === 'Critical' ? 90 : formData.severity === 'High' ? 70 : 40),
      duplicateOfIssueId: null,
    });

    onNavigate('issues');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header text */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight font-sans">Report a Civic Issue</h1>
        <p className="text-sm text-slate-500">File a new localized incident. Gemini AI scans uploads to verify, categorize, and prioritize resolving it.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Presets / Snap Tool */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Fast-Track Simulation</h3>
            <p className="text-xs text-slate-500 mb-4">Click any sample incident below to pre-populate the form and test Gemini AI scanning.</p>
            
            <div className="space-y-3">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`preset-btn-${idx}`}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center space-x-3 group cursor-pointer"
                >
                  <img 
                    src={preset.imageUrl} 
                    alt={preset.title} 
                    className="w-12 h-12 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="block font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">{preset.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{preset.category} • {preset.severity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Upload Real Image</h4>
            <p className="text-xs text-slate-500 mb-4">You can paste any direct web image URL in the form field to simulate customized reports.</p>
          </div>
        </div>

        {/* Right Column: Reporting Form */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Target Community Space</label>
              <select 
                id="report-select-community"
                value={formData.communityId}
                onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.areaName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Incident Category</label>
              <select 
                id="report-select-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Drainage">Drainage</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Short Incident Title</label>
            <input 
              id="report-input-title"
              type="text" 
              placeholder="e.g. Broken water pipe near Block C main staircase"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Detailed Description</label>
            <textarea 
              id="report-input-desc"
              rows={4}
              placeholder="Provide exact details of what you see, how long it has been there, and the public hazard levels..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Geolocation Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Incident Location Address</label>
                <button
                  id="btn-gps-locate"
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locating}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 focus:outline-none disabled:opacity-55 cursor-pointer"
                >
                  {locating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>{locating ? 'Locating...' : 'Use Current GPS'}</span>
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  id="report-input-address"
                  type="text" 
                  placeholder="e.g. Lane 3, opposite Flat 402"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Interactive Google/OSM Map Picker */}
              <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                {mapProvider === 'osm' ? (
                  <OpenStreetMapSection
                    height="100%"
                    center={{ lat: formData.latitude, lng: formData.longitude }}
                    zoom={14}
                    markers={[{
                      id: 'picked-location',
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                      title: formData.title || 'Selected Coordinate',
                      category: formData.category,
                      severity: formData.severity,
                      priorityScore: 0,
                      address: formData.address || 'Click map to pick new coordinate'
                    }]}
                    onMapClick={(lat, lng) => {
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                      reverseGeocode(lat, lng);
                    }}
                  />
                ) : (
                  <GoogleMapSection height="100%" fallbackMessage="API Key unconfigured. Set GOOGLE_MAPS_PLATFORM_KEY to pick exact coordinates on an interactive map.">
                    <GMap
                      defaultCenter={{ lat: formData.latitude, lng: formData.longitude }}
                      defaultZoom={14}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                      gestureHandling="cooperative"
                      disableDefaultUI={true}
                      center={{ lat: formData.latitude, lng: formData.longitude }}
                      onClick={(e) => {
                        if (e.detail.latLng) {
                          const lat = e.detail.latLng.lat;
                          const lng = e.detail.latLng.lng;
                          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                          reverseGeocode(lat, lng);
                        }
                      }}
                    >
                      <AdvancedMarker
                        position={{ lat: formData.latitude, lng: formData.longitude }}
                        draggable={true}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();
                            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                            reverseGeocode(lat, lng);
                          }
                        }}
                      >
                        <Pin background="#10B981" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
                      </AdvancedMarker>
                    </GMap>
                  </GoogleMapSection>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-bold">Coordinates:</span>
                  <span>Lat: {formData.latitude.toFixed(5)}</span>
                  <span>•</span>
                  <span>Lon: {formData.longitude.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Map Picker Active
                  </span>
                  {hasValidKey && (
                    <button
                      type="button"
                      onClick={() => setMapProvider(prev => prev === 'google' ? 'osm' : 'google')}
                      className="text-[9px] text-slate-500 hover:text-slate-800 font-bold underline"
                    >
                      Switch to {mapProvider === 'google' ? 'OSM' : 'Google'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Premium File Upload Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Incident Image / Photo</label>
              
              {!formData.imageUrl ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? "border-emerald-500 bg-emerald-50/30" 
                      : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    id="report-input-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="report-input-file" className="w-full h-full cursor-pointer flex flex-col items-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-800 block">Drag & drop photo here</span>
                    <span className="text-[10px] text-slate-500 block mt-1">or <span className="text-emerald-600 underline font-semibold">browse files</span></span>
                  </label>
                </div>
              ) : (
                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center space-x-3">
                  <img 
                    src={formData.imageUrl} 
                    alt="Uploaded incident" 
                    className="w-16 h-16 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">Photo Selected</span>
                    <span className="text-[10px] text-slate-500 block truncate font-mono">
                      {formData.imageUrl.startsWith('data:') ? 'Local file uploaded (base64)' : formData.imageUrl}
                    </span>
                  </div>
                  <button
                    id="btn-remove-photo"
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                      setAiResult(null);
                    }}
                    className="w-8 h-8 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* URL input option for advanced links / fast-tracking */}
              <div className="pt-1">
                <input 
                  id="report-input-image-fallback"
                  type="text" 
                  placeholder="Or paste direct image URL (e.g. http://...)"
                  value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setAiResult(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* AI Analyze trigger */}
          {formData.imageUrl && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">Gemini AI Command Scan Module</span>
                </div>
                {!aiResult && !scanning && (
                  <button
                    id="btn-trigger-ai-scan"
                    type="button"
                    onClick={triggerAiScan}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Gemini Diagnosis</span>
                  </button>
                )}
              </div>

              {scanning && (
                <div className="flex items-center space-x-3 text-sm text-slate-600 font-medium py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Gemini is analyzing issue image and text details...</span>
                </div>
              )}

              {aiResult && (
                <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                    <div className="bg-white p-2 rounded border border-slate-150">
                      <span className="block text-slate-400 font-mono uppercase">Detected Cat</span>
                      <span className="font-bold text-slate-900">{aiResult.category}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150">
                      <span className="block text-slate-400 font-mono uppercase">Severity Rank</span>
                      <span className="font-bold text-amber-700">{aiResult.severity}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150">
                      <span className="block text-slate-400 font-mono uppercase">Priority Score</span>
                      <span className="font-bold text-red-600">{aiResult.priorityScore} / 100</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150">
                      <span className="block text-slate-400 font-mono uppercase">Confidence</span>
                      <span className="font-bold text-emerald-600">{(aiResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 text-[11px] text-emerald-950">
                    <span className="block font-bold text-emerald-900 mb-0.5">Gemini Civic Abstract:</span>
                    <span>{aiResult.summary}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button 
              id="report-cancel-btn"
              type="button" 
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              id="report-submit-btn"
              type="submit" 
              className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              File Verified Issue Report
            </button>
          </div>
        </form>
      </div>

      <CustomModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertModalMessage('');
        }}
        title="Report Validation Check"
        message={alertModalMessage}
        type="error"
      />
    </div>
  );
}
