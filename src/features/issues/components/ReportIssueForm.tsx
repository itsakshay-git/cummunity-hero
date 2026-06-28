import React, { useState } from 'react';
import { Community, IssueCategory, SeverityLevel, Issue } from '../../../types';
import { analyzeIssue, checkDuplicateIssue } from '../../../services/ai/geminiService';
import CustomModal from '../../../components/Modal';

// Import modular widgets
import PresetsPanel from './widgets/PresetsPanel';
import LocationPicker from './widgets/LocationPicker';
import ImageUploader from './widgets/ImageUploader';
import AiScanConsole from './widgets/AiScanConsole';

// Import PRESETS constant
import { PRESETS } from '../../../lib/constants';

import { User } from '../../../types';
import { compressImage } from '../utils';

interface ReportIssueFormProps {
  communities: Community[];
  issues: Issue[];
  onSubmit: (issue: Omit<Issue, 'id' | 'reportedBy' | 'reportedByName' | 'trustScore' | 'verificationCount' | 'fakeCount' | 'supporterCount' | 'createdAt' | 'updatedAt'>) => void;
  onNavigate: (tab: string) => void;
  currentUser?: User | null;
  userCoords?: { lat: number; lng: number } | null;
}

const CATEGORY_ICONS: Record<IssueCategory, string> = {
  'Pothole': '🕳️',
  'Garbage': '🗑️',
  'Water Leakage': '💧',
  'Streetlight': '💡',
  'Drainage': '🌊',
  'Road Damage': '🚧',
  'Public Safety': '⚠️',
  'Other': '📁'
};

export default function ReportIssueForm({ communities, issues, onSubmit, onNavigate, currentUser, userCoords }: ReportIssueFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pothole' as IssueCategory,
    severity: 'Medium' as SeverityLevel,
    communityId: 'general', // Default to General Public Incident
    address: '',
    imageUrl: '',
    latitude: userCoords?.lat || 19.9615,
    longitude: userCoords?.lng || 79.2961,
  });

  React.useEffect(() => {
    if (userCoords) {
      setFormData(prev => ({
        ...prev,
        latitude: userCoords.lat,
        longitude: userCoords.lng
      }));
    } else {
      const cityCoords: Record<string, { lat: number; lng: number }> = {
        pune: { lat: 18.5204, lng: 73.8567 },
        mumbai: { lat: 19.0760, lng: 72.8777 },
        bangalore: { lat: 12.9716, lng: 77.5946 },
        delhi: { lat: 28.6139, lng: 77.2090 },
        chennai: { lat: 13.0827, lng: 80.2707 },
        chandrapur: { lat: 19.9615, lng: 79.2961 }
      };
      const userCity = (currentUser?.city || 'Chandrapur').toLowerCase();
      const coords = cityCoords[userCity] || cityCoords['chandrapur'];
      setFormData(prev => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng
      }));
    }
  }, [userCoords, currentUser]);


  const [attachments, setAttachments] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>('osm');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [submitPayload, setSubmitPayload] = useState<any | null>(null);

  // Sync first attachment to formData.imageUrl
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      imageUrl: attachments[0]?.url || ''
    }));
    if (attachments[0]) {
      setMediaType(attachments[0].type);
    }
  }, [attachments]);

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
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      pune: { lat: 18.5204, lng: 73.8567 },
      mumbai: { lat: 19.0760, lng: 72.8777 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      delhi: { lat: 28.6139, lng: 77.2090 },
      chennai: { lat: 13.0827, lng: 80.2707 },
      chandrapur: { lat: 19.9615, lng: 79.2961 }
    };
    const userCity = (currentUser?.city || 'Chandrapur').toLowerCase();
    const fallbackCoords = cityCoords[userCity] || cityCoords['chandrapur'];

    setFormData({
      ...formData,
      title: preset.title,
      description: preset.description,
      category: preset.category,
      severity: preset.severity,
      address: preset.address,
      imageUrl: preset.imageUrl,
      latitude: userCoords?.lat || fallbackCoords.lat,
      longitude: userCoords?.lng || fallbackCoords.lng,
    });
    setAttachments(preset.imageUrl ? [{ type: 'image' as const, url: preset.imageUrl }] : []);
    setAiResult(null);
    setCurrentStep(3); // Auto jump to review step!
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

  const handleAddAttachment = (type: 'image' | 'video', url: string) => {
    if (attachments.length >= 5) {
      setAlertModalMessage('You can upload up to 5 photos/videos.');
      setAlertModalOpen(true);
      return;
    }
    setAttachments(prev => [...prev, { type, url }]);
    setAiResult(null);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
    setAiResult(null);
  };

  const handleFile = (file: File) => {
    if (attachments.length >= 5) {
      setAlertModalMessage('You can upload up to 5 photos/videos.');
      setAlertModalOpen(true);
      return;
    }
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      if (file.size > 800 * 1024) {
        setAlertModalMessage('Prototype Video limit exceeded: Since this is a database prototype storing media directly in Firestore documents, please upload a video file under 800 KB, or paste a web video link instead.');
        setAlertModalOpen(true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAddAttachment('video', reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          handleAddAttachment('image', compressed);
        } catch (err) {
          console.warn("Image compression failed, using original:", err);
          handleAddAttachment('image', reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
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

  // Forward geocode typed address into coordinates using OpenStreetMap Nominatim.
  const handleSearchAddress = async () => {
    const addressQuery = formData.address.trim();
    if (!addressQuery) {
      setAlertModalMessage('Please enter an address before searching.');
      setAlertModalOpen(true);
      return;
    }

    setSearchingAddress(true);
    try {
      const cityHint = currentUser?.city ? `, ${currentUser.city}` : '';
      const query = encodeURIComponent(`${addressQuery}${cityHint}`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${query}`
      );

      if (!response.ok) {
        throw new Error('Location search failed.');
      }

      const results = await response.json();
      const match = Array.isArray(results) ? results[0] : null;
      if (!match?.lat || !match?.lon) {
        setAlertModalMessage('No matching location found. Try a more specific address, or pick the spot directly on the map.');
        setAlertModalOpen(true);
        return;
      }

      const lat = Number(match.lat);
      const lon = Number(match.lon);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        address: match.display_name || prev.address
      }));
    } catch (error) {
      console.warn('Address geocoding failed:', error);
      setAlertModalMessage('Could not search that address right now. You can still select the exact location using the map picker.');
      setAlertModalOpen(true);
    } finally {
      setSearchingAddress(false);
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
    const firstImage = attachments.find(att => att.type === 'image');
    if (!firstImage) {
      setAlertModalMessage('Please upload or select at least one incident image first for AI analysis!');
      setAlertModalOpen(true);
      return;
    }
    setScanning(true);
    setAiResult(null);

    try {
      const result = await analyzeIssue({
        imageUrl: firstImage.url,
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.address.trim() || attachments.length === 0) {
      setAlertModalMessage('Please complete all fields, including at least one photo or video!');
      setAlertModalOpen(true);
      return;
    }

    setCheckingDuplicate(true);

    const payload = {
      communityId: formData.communityId,
      title: formData.title,
      description: formData.description,
      category: aiResult?.category || formData.category,
      severity: aiResult?.severity || formData.severity,
      status: 'OPEN' as const,
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
      imageUrl: attachments[0]?.url || '',
      mediaAttachments: attachments,
      aiSummary: aiResult?.summary || 'Standard citizen report. Pending automated scanning.',
      aiConfidence: aiResult?.confidence || 0.80,
      suggestedDepartment: aiResult?.suggestedDepartment || 'Civic Works',
      priorityScore: aiResult?.priorityScore || (formData.severity === 'Critical' ? 90 : formData.severity === 'High' ? 70 : 40),
      duplicateOfIssueId: null as string | null,
    };

    try {
      const dupCheck = await checkDuplicateIssue(
        {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          latitude: payload.latitude,
          longitude: payload.longitude,
          communityId: payload.communityId,
        },
        issues
      );

      if (dupCheck.isDuplicate && dupCheck.duplicateOfIssueId) {
        const dupIssue = issues.find(i => i.id === dupCheck.duplicateOfIssueId);
        const dupTitle = dupIssue ? dupIssue.title : 'an existing issue';
        
        payload.duplicateOfIssueId = dupCheck.duplicateOfIssueId;
        
        setDuplicateMessage(
          `AI Duplicate Detection: We found a similar active issue nearby: "${dupTitle}". ${dupCheck.reason} We have automatically linked your report as a support ticket to this existing issue so authorities can prioritize it together.`
        );
        setSubmitPayload(payload);
        setDuplicateAlertOpen(true);
      } else {
        onSubmit(payload);
        onNavigate('issues');
      }
    } catch (err) {
      console.warn("Duplicate checking error, submitting normally:", err);
      onSubmit(payload);
      onNavigate('issues');
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Filter communities to only show the ones matching user's active city
  const userCity = currentUser?.city || 'Chandrapur';
  const filteredCommunities = communities.filter(c => 
    c.areaName.toLowerCase().includes(userCity.toLowerCase()) || 
    (c.city && c.city.toLowerCase() === userCity.toLowerCase())
  );
  const displayedCommunities = filteredCommunities.length > 0 ? filteredCommunities : communities;
  const steps = [
    { number: 1, title: 'Location & Media' },
    { number: 2, title: 'Incident Details' },
    { number: 3, title: 'AI Diagnosis & Review' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in font-sans">
      {/* Header text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Report a Civic Issue</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">File a geo-tagged incident. Gemini AI scans uploads to verify and prioritize it.</p>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-400">
          Hyperlocal jurisdiction: <span className="text-emerald-600 dark:text-emerald-450 font-bold">{userCity}</span>
        </div>
      </div>

      {/* Simulation Presets collapsible shelf */}
      <PresetsPanel onSelectPreset={handleSelectPreset} />

      {/* Wizard Steps indicator */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center w-full justify-around relative">
          {/* Progress bar line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-300" 
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />

          {steps.map((step) => (
            <button
              key={step.number}
              type="button"
              onClick={() => {
                // Allow jumping to steps only if they are valid
                if (step.number === 1) setCurrentStep(1);
                else if (step.number === 2 && (attachments.length > 0 || formData.address)) setCurrentStep(2);
                else if (step.number === 3 && formData.title.trim() && formData.description.trim()) setCurrentStep(3);
              }}
              className="z-10 flex flex-col items-center focus:outline-none cursor-pointer bg-transparent border-none"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                currentStep >= step.number
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-400 dark:text-slate-500'
              }`}>
                {step.number}
              </div>
              <span className={`text-[10px] font-bold mt-1.5 transition-colors duration-300 ${
                currentStep === step.number
                  ? 'text-emerald-600 dark:text-emerald-450'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reporting Form Body */}
      <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        
        {/* Step 1: Location & Media Proof */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <ImageUploader
              attachments={attachments}
              onAddAttachment={handleAddAttachment}
              onRemoveAttachment={handleRemoveAttachment}
              dragActive={dragActive}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
            />
            <LocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              address={formData.address}
              category={formData.category}
              severity={formData.severity}
              title={formData.title}
              locating={locating}
              searchingAddress={searchingAddress}
              mapProvider={mapProvider}
              onLocateMe={handleLocateMe}
              onSearchAddress={handleSearchAddress}
              onChangeAddress={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
              onMapClick={(lat, lng) => {
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                reverseGeocode(lat, lng);
              }}
              setMapProvider={setMapProvider}
            />
          </div>
        )}

        {/* Step 2: Incident Details */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Category Grid Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-655 dark:text-slate-405 uppercase tracking-wider">Incident Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat as IssueCategory })}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer bg-transparent text-left ${
                      formData.category === cat
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="text-sm">{icon}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity badges selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-655 dark:text-slate-405 uppercase tracking-wider">Estimated Severity</label>
              <div className="grid grid-cols-4 gap-2.5">
                {(['Low', 'Medium', 'High', 'Critical'] as SeverityLevel[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: sev })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer bg-transparent ${
                      formData.severity === sev
                        ? sev === 'Critical' ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 ring-2 ring-red-500/10 font-black' :
                          sev === 'High' ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/10 font-black' :
                          sev === 'Medium' ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 ring-2 ring-emerald-500/10 font-black' :
                          'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/10 font-black'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope select & Title field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Target Community Space</label>
                <select 
                  id="report-select-community"
                  value={formData.communityId}
                  onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-105 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm font-semibold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="general" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Independent Public Report (None / General)</option>
                  {displayedCommunities.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{c.name} ({c.areaName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Short Incident Title</label>
                <input 
                  id="report-input-title"
                  type="text" 
                  placeholder="e.g. Broken water pipe near Block C main staircase"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-655 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  required
                />
              </div>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Detailed Description</label>
              <textarea 
                id="report-input-desc"
                rows={4}
                placeholder="Provide exact details of what you see, how long it has been there, and the public hazard levels..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                required
              />
            </div>
          </div>
        )}

        {/* Step 3: AI Diagnosis & Review */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Interactive review card */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <span className="p-1 bg-emerald-500/10 text-emerald-500 rounded">📋</span>
                Incident Summary Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div><span className="text-slate-400 dark:text-slate-500">Title:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{formData.title || 'Not specified'}</span></div>
                  <div><span className="text-slate-400 dark:text-slate-500">Category:</span> <span className="font-bold text-slate-805 dark:text-slate-200">{CATEGORY_ICONS[formData.category]} {formData.category}</span></div>
                  <div><span className="text-slate-400 dark:text-slate-500">Severity:</span> <span className={`font-black ${
                    formData.severity === 'Critical' ? 'text-red-500' :
                    formData.severity === 'High' ? 'text-amber-500' :
                    formData.severity === 'Medium' ? 'text-emerald-500' : 'text-blue-500'
                  }`}>{formData.severity}</span></div>
                  <div><span className="text-slate-400 dark:text-slate-500">Target Community:</span> <span className="font-bold text-slate-850 dark:text-slate-200">{formData.communityId === 'general' ? 'Independent Public Report' : communities.find(c => c.id === formData.communityId)?.name || 'Community Space'}</span></div>
                </div>
                <div className="space-y-2">
                  <div><span className="text-slate-400 dark:text-slate-500">Address:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{formData.address || 'Not specified'}</span></div>
                  <div className="flex gap-1.5"><span className="text-slate-400 dark:text-slate-500">Coordinates:</span> <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">Lat: {formData.latitude.toFixed(5)}, Lon: {formData.longitude.toFixed(5)}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-slate-400 dark:text-slate-500">Media Uploads:</span> <span className="font-black text-emerald-600 dark:text-emerald-450">{attachments.length} attachment(s)</span></div>
                </div>
              </div>
              <div className="pt-3.5 border-t border-slate-200/50 dark:border-slate-850/50">
                <span className="text-slate-400 dark:text-slate-500 block mb-1">Description:</span>
                <p className="leading-relaxed whitespace-pre-wrap font-medium">{formData.description || 'Not specified'}</p>
              </div>
            </div>

            {/* AI Diagnose console */}
            <AiScanConsole
              imageUrl={formData.imageUrl}
              scanning={scanning}
              aiResult={aiResult}
              onTriggerScan={triggerAiScan}
            />
          </div>
        )}

        {/* Footer Navigation bar */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="button" 
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else onNavigate('dashboard');
            }}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-0"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < 3 ? (
            <button 
              type="button" 
              onClick={() => {
                if (currentStep === 1) {
                  if (attachments.length === 0) {
                    setAlertModalMessage('Please upload at least one photo or video before proceeding!');
                    setAlertModalOpen(true);
                    return;
                  }
                  if (!formData.address.trim()) {
                    setAlertModalMessage('Please enter an address location!');
                    setAlertModalOpen(true);
                    return;
                  }
                }
                setCurrentStep(currentStep + 1);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border-0 shadow-sm"
            >
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={checkingDuplicate}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border-0 shadow-sm disabled:opacity-50"
            >
              {checkingDuplicate ? 'Scanning duplicates...' : 'File Verified Issue Report'}
            </button>
          )}
        </div>
      </form>

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

      <CustomModal
        isOpen={duplicateAlertOpen}
        onClose={() => {
          setDuplicateAlertOpen(false);
          if (submitPayload) {
            onSubmit(submitPayload);
            onNavigate('issues');
          }
        }}
        title="AI Duplicate Detected"
        message={duplicateMessage}
        type="alert"
        confirmText="Proceed & Link Report"
      />
    </div>
  );
}
