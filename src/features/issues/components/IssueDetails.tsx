import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, User, Shield, Sparkles, CheckCircle2, AlertTriangle, 
  ThumbsUp, ThumbsDown, MessageSquare, Wrench, RefreshCw, Send, Award, Clock
} from 'lucide-react';
import { Issue, IssueVerification, IssueStatus, UserRole } from '../../../types';
import { GoogleMapSection, hasValidKey } from '../../maps/components/GoogleMapSection';
import { Map as GMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import OpenStreetMapSection from '../../maps/components/OpenStreetMapSection';
import CustomModal from '../../../components/Modal';

interface IssueDetailsProps {
  issue: Issue;
  verifications: IssueVerification[];
  onBack: () => void;
  onCastVote: (voteType: 'CONFIRM' | 'FAKE' | 'RESOLVED', comment: string) => void;
  currentUserRole: UserRole;
  onAdminUpdate: (status: IssueStatus, note: string, resolutionImg?: string) => void;
}

export default function IssueDetails({
  issue,
  verifications,
  onBack,
  onCastVote,
  currentUserRole,
  onAdminUpdate
}: IssueDetailsProps) {
  const [voteType, setVoteType] = useState<'CONFIRM' | 'FAKE' | 'RESOLVED'>('CONFIRM');
  const [voteComment, setVoteComment] = useState('');
  const [adminStatus, setAdminStatus] = useState<IssueStatus>(issue.status);
  const [adminNote, setAdminNote] = useState('');
  const [adminResImg, setAdminResImg] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>('osm');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  // Auto-switch to OpenStreetMap if Google Maps auth/billing fails
  React.useEffect(() => {
    const handleAuthFailure = () => {
      console.warn("Switching IssueDetails map to OpenStreetMap due to API auth/billing failure.");
      setMapProvider('osm');
    };
    window.addEventListener('gmp-auth-failure', handleAuthFailure);
    return () => {
      window.removeEventListener('gmp-auth-failure', handleAuthFailure);
    };
  }, []);

  const filteredVerifications = verifications.filter(v => v.issueId === issue.id);

  // Status timeline markers
  const statusSteps: IssueStatus[] = ['OPEN', 'COMMUNITY_VERIFIED', 'IN_PROGRESS', 'RESOLUTION_UPLOADED', 'RESOLVED'];
  const currentStepIndex = statusSteps.indexOf(issue.status);

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voteComment.trim()) {
      setAlertModalMessage('Please include a verification comment.');
      setAlertModalOpen(true);
      return;
    }
    onCastVote(voteType, voteComment);
    setVoteComment('');
  };

  const handleAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNote.trim()) {
      setAlertModalMessage('Please fill out progress/resolution notes.');
      setAlertModalOpen(true);
      return;
    }
    onAdminUpdate(adminStatus, adminNote, adminResImg);
    setAdminNote('');
    setAdminResImg('');
    setShowAdminPanel(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Return link */}
      <button 
        id="btn-back-to-directory"
        onClick={onBack}
        className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Directory</span>
      </button>

      {/* Main Grid: Details + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Ticket Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Image */}
            <div className="relative h-64 bg-slate-100 overflow-hidden md:h-96">
              <img 
                src={issue.imageUrl} 
                alt={issue.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex space-x-2">
                <span className={`font-mono text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow ${
                  issue.severity === 'Critical' ? 'bg-rose-600 text-white' :
                  issue.severity === 'High' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {issue.severity} Severity
                </span>
                <span className="bg-slate-900/85 backdrop-blur text-white font-mono text-[10px] px-3 py-1 rounded-full">
                  {issue.category}
                </span>
              </div>
            </div>

            {/* Title, reporter & location */}
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <h1 className="text-xl md:text-2xl font-bold text-slate-950 font-sans tracking-tight">
                  {issue.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Reported by {issue.reportedByName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>On {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{issue.address}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Citizen Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {issue.description}
                </p>
              </div>

              {/* Status Timeline Progress Bar */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Incident Progress Lifecycle</h3>
                
                <div className="relative flex items-center justify-between">
                  {/* Background line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-slate-200 z-0" />
                  {/* Progress active line */}
                  <div 
                    className="absolute left-0 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%` }}
                  />

                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all ${
                          isCompleted ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'
                        } ${isActive ? 'ring-4 ring-emerald-500/15 scale-110' : ''}`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 mt-2 tracking-wide uppercase max-w-[65px] text-center leading-tight">
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution Info if available */}
              {issue.status === 'RESOLVED' && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span className="font-bold text-emerald-900 text-sm">Resolution Proof & Verification</span>
                  </div>
                  {issue.resolutionImageUrl && (
                    <img 
                      src={issue.resolutionImageUrl} 
                      alt="Resolution Proof" 
                      className="w-full max-h-60 object-cover rounded-xl border border-emerald-100 shadow-sm"
                    />
                  )}
                  <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-line">
                    <strong className="block text-emerald-900 font-bold mb-0.5">Assigned Resolver Note:</strong>
                    {issue.resolutionNote || 'The designated plumbing or municipal repairs completed. Issue marked resolved.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Citizen comments & verification timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              <span>Verifications & Local Log ({filteredVerifications.length})</span>
            </h3>

            <div className="space-y-4">
              {filteredVerifications.length === 0 ? (
                <p className="text-xs text-slate-500">No verifications or feedback reported yet for this incident.</p>
              ) : (
                filteredVerifications.map(v => (
                  <div key={v.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-slate-900">{v.userName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">{new Date(v.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        v.voteType === 'CONFIRM' ? 'bg-emerald-50 text-emerald-700' :
                        v.voteType === 'FAKE' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {v.voteType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{v.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Voting comment form */}
            <form onSubmit={handleVoteSubmit} className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="font-bold text-slate-900 text-xs">Add Your Verification Report</h4>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                  <input 
                    type="radio" 
                    name="voteType" 
                    value="CONFIRM"
                    checked={voteType === 'CONFIRM'}
                    onChange={() => setVoteType('CONFIRM')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Confirm Real</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                  <input 
                    type="radio" 
                    name="voteType" 
                    value="FAKE"
                    checked={voteType === 'FAKE'}
                    onChange={() => setVoteType('FAKE')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Flag as Fake / Spam</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                  <input 
                    type="radio" 
                    name="voteType" 
                    value="RESOLVED"
                    checked={voteType === 'RESOLVED'}
                    onChange={() => setVoteType('RESOLVED')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Verify Already Fixed</span>
                </label>
              </div>

              <div className="flex gap-2">
                <input 
                  id="vote-comment-input"
                  type="text" 
                  placeholder="Explain why you verify this, specify any recent changes..."
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  className="flex-grow px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <button 
                  id="vote-submit-btn"
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Vote</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Columns: Scores & Actions Panel */}
        <div className="space-y-6">
          
          {/* Priority Score Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 text-sm">Incident Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <span className="block text-2xl font-extrabold text-red-600">{issue.priorityScore}</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Priority Score</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <span className="block text-2xl font-extrabold text-emerald-600">{issue.trustScore}%</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Trust Level</span>
              </div>
            </div>

            <div className="space-y-2 text-slate-600 text-xs">
              <div className="flex justify-between">
                <span>Confirm Votes</span>
                <span className="font-bold text-slate-900">{issue.verificationCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Flagged Fakes</span>
                <span className="font-bold text-slate-900">{issue.fakeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Confidence Rating</span>
                <span className="font-bold text-slate-900">{(issue.aiConfidence ? issue.aiConfidence * 100 : 80).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Reported Location Map Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-950 text-sm flex items-center justify-between">
              <span>Incident Location Map</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono font-medium">Zoom Active</span>
                {hasValidKey && (
                  <button
                    onClick={() => setMapProvider(prev => prev === 'google' ? 'osm' : 'google')}
                    className="text-[9px] text-slate-500 hover:text-slate-800 font-bold underline"
                  >
                    Use {mapProvider === 'google' ? 'OSM' : 'Google'}
                  </button>
                )}
              </div>
            </h3>
            
            <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              {mapProvider === 'osm' ? (
                <OpenStreetMapSection
                  height="100%"
                  center={{ lat: issue.latitude, lng: issue.longitude }}
                  zoom={15}
                  markers={[{
                    id: issue.id,
                    latitude: issue.latitude,
                    longitude: issue.longitude,
                    title: issue.title,
                    category: issue.category,
                    severity: issue.severity,
                    priorityScore: issue.priorityScore,
                    address: issue.address,
                    imageUrl: issue.imageUrl
                  }]}
                />
              ) : (
                <GoogleMapSection height="100%" fallbackMessage="Set GOOGLE_MAPS_PLATFORM_KEY to render the precise incident satellite map.">
                  <GMap
                    defaultCenter={{ lat: issue.latitude, lng: issue.longitude }}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    gestureHandling="cooperative"
                    disableDefaultUI={true}
                  >
                    <AdvancedMarker position={{ lat: issue.latitude, lng: issue.longitude }}>
                      <Pin background="#DC2626" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
                    </AdvancedMarker>
                  </GMap>
                </GoogleMapSection>
              )}
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Geolocated at Pune coordinate bounds: <strong className="text-slate-700 font-mono">{issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}</strong>. 
            </p>
          </div>

          {/* Gemini AI Summary Card */}
          {issue.aiSummary && (
            <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-emerald-50 p-6 rounded-2xl border border-emerald-900 shadow-sm space-y-3.5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">Gemini Scan Summary</span>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed italic">
                "{issue.aiSummary}"
              </p>
              <div className="border-t border-emerald-800/60 pt-3 text-[10px] space-y-1 text-emerald-200 font-mono">
                <div>Suggested Dept: <span className="text-white font-bold">{issue.suggestedDepartment || 'Public Safety'}</span></div>
                <div>Confidence Metric: <span className="text-white font-bold">{(issue.aiConfidence ? issue.aiConfidence * 100 : 80).toFixed(0)}%</span></div>
              </div>
            </div>
          )}

          {/* Admin Control Module Trigger */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Coordinating Actions</h3>
            <p className="text-xs text-slate-500">Only authorized Admin, Resolver, or Super Admin personnel may change ticket resolutions.</p>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>My Active Role: <strong>{currentUserRole}</strong></span>
              </div>
            </div>

            <button 
              id="admin-panel-toggle"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Toggle Admin Actions Console</span>
            </button>
          </div>

          {/* Admin action panel drawer details */}
          {showAdminPanel && (
            <form onSubmit={handleAdminFormSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 animate-scale-up">
              <h4 className="font-bold text-slate-950 text-xs">Resolve Ticket Details</h4>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Update Ticket Status</label>
                <select 
                  id="admin-select-status"
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as IssueStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none"
                >
                  <option value="OPEN">OPEN (Submitted)</option>
                  <option value="COMMUNITY_VERIFIED">COMMUNITY_VERIFIED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLUTION_UPLOADED">RESOLUTION_UPLOADED</option>
                  <option value="RESOLVED">RESOLVED (Closed)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Progress / Resolution Notes</label>
                <textarea 
                  id="admin-textarea-notes"
                  rows={3}
                  placeholder="Explain actions taken, department feedback, plumbing logs, etc..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Resolution Image URL (Optional Proof)</label>
                <input 
                  id="admin-input-image"
                  type="text" 
                  placeholder="e.g. paste repaired image .jpg link..."
                  value={adminResImg}
                  onChange={(e) => setAdminResImg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none font-mono"
                />
              </div>

              <button 
                id="admin-submit-update-btn"
                type="submit"
                className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                Apply Progress Update
              </button>
            </form>
          )}

        </div>
      </div>

      <CustomModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertModalMessage('');
        }}
        title="Action Required"
        message={alertModalMessage}
        type="error"
      />
    </div>
  );
}
