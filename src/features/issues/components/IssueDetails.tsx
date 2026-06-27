import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, User as UserIcon, Shield, Sparkles, CheckCircle2, AlertTriangle, 
  ThumbsUp, ThumbsDown, MessageSquare, Wrench, RefreshCw, Send, Award, Clock, Edit3, Trash2
} from 'lucide-react';
import { Issue, IssueVerification, IssueStatus, UserRole, User, Community } from '../../../types';
import { GoogleMapSection, hasValidKey } from '../../maps/components/GoogleMapSection';
import { Map as GMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import OpenStreetMapSection from '../../maps/components/OpenStreetMapSection';
import CustomModal from '../../../components/Modal';
import MediaCarousel from '../../../components/ui/MediaCarousel';
import ImageUploader from './widgets/ImageUploader';
import { compressImage } from '../utils';

interface IssueDetailsProps {
  issue: Issue;
  verifications: IssueVerification[];
  onBack: () => void;
  onCastVote: (voteType: 'CONFIRM' | 'FAKE' | 'RESOLVED', comment: string) => void;
  currentUserRole: UserRole;
  onAdminUpdate: (status: IssueStatus, note: string, resolutionImg?: string) => void;
  currentUser?: User | null;
  onMarkAsDuplicate?: (issueId: string, duplicateOfId: string | null) => void;
  issues?: Issue[];
  communities?: Community[];
  onUpdateIssue?: (issueId: string, updatedFields: Partial<Issue>) => void;
  onDeleteIssue?: (issueId: string) => void;
  onViewUserProfile?: (userId: string) => void;
}

export default function IssueDetails({
  issue,
  verifications,
  onBack,
  onCastVote,
  currentUserRole,
  onAdminUpdate,
  currentUser,
  onMarkAsDuplicate,
  issues,
  communities = [],
  onUpdateIssue,
  onDeleteIssue,
  onViewUserProfile
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

  // Editing and Deletion states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(issue.title);
  const [editDescription, setEditDescription] = useState(issue.description);
  const [editAttachments, setEditAttachments] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [editDragActive, setEditDragActive] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const startEditing = () => {
    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditAttachments(issue.mediaAttachments || (issue.imageUrl ? [{ type: 'image', url: issue.imageUrl }] : []));
    setIsEditing(true);
  };

  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setEditDragActive(true);
    } else if (e.type === "dragleave") {
      setEditDragActive(false);
    }
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEditFile(e.dataTransfer.files[0]);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleEditFile(e.target.files[0]);
    }
  };

  const handleEditFile = (file: File) => {
    if (editAttachments.length >= 5) {
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
        setEditAttachments(prev => [...prev, { type: 'video', url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setEditAttachments(prev => [...prev, { type: 'image', url: compressed }]);
        } catch (err) {
          console.warn("Image compression failed, using original:", err);
          setEditAttachments(prev => [...prev, { type: 'image', url: reader.result as string }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      setAlertModalMessage('Please fill in both the title and description.');
      setAlertModalOpen(true);
      return;
    }
    if (editAttachments.length === 0) {
      setAlertModalMessage('Please attach at least one photo or video.');
      setAlertModalOpen(true);
      return;
    }
    if (onUpdateIssue) {
      onUpdateIssue(issue.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        mediaAttachments: editAttachments,
        imageUrl: editAttachments[0]?.url || ''
      });
    }
    setIsEditing(false);
  };

  const handleDeleteConfirm = () => {
    if (onDeleteIssue) {
      onDeleteIssue(issue.id);
      onBack();
    }
  };

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

  const handleGoToMaster = () => {
    if (issue.duplicateOfIssueId) {
      window.location.hash = `#/issue-details?id=${issue.duplicateOfIssueId}`;
    }
  };

  // Find the community this issue belongs to
  const targetCommunity = communities?.find(c => c.id === issue.communityId);
  
  // Check if current user is an admin of this specific community
  const isSpaceAdmin = targetCommunity && currentUser && targetCommunity.adminIds.includes(currentUser.id);
  
  // Check if current user is the owner (reporter) of this issue
  const isOwner = currentUser && issue.reportedBy === currentUser.id;
  
  // Edit / Delete rights: Only the owner or the specific community's admin
  const isReporterOrAdmin = isOwner || isSpaceAdmin;
  
  // Coordinating actions (Status update & mark duplicate): Resolver, Authority, or the specific community admin
  const isAuthorizedToResolve = currentUserRole === 'Resolver' || currentUserRole === 'Authority' || isSpaceAdmin;
  const isAuthorizedToDuplicate = isAuthorizedToResolve || isOwner;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200 font-sans pb-12">
      {/* Return link and Action Buttons */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <button 
          id="btn-back-to-directory"
          onClick={onBack}
          className="flex items-center space-x-2 text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-650 dark:hover:text-emerald-450 transition-colors cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Directory</span>
        </button>

        {isReporterOrAdmin && !isEditing && (
          <div className="flex items-center space-x-2">
            <button
              onClick={startEditing}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[10px] sm:text-xs font-bold rounded-lg transition-colors border-0 cursor-pointer flex items-center space-x-1"
              title="Edit Issue Title, Description, and Media"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Report</span>
            </button>
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] sm:text-xs font-bold rounded-lg transition-colors border-0 cursor-pointer flex items-center space-x-1"
              title="Delete Issue Report permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Duplicate warning banner */}
      {issue.duplicateOfIssueId && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-400">Duplicate Incident Link</h4>
            <p className="text-[11px] text-amber-800 dark:text-slate-400 leading-relaxed">
              This issue has been marked as a duplicate of a primary master ticket. Comments, voting, and status changes are coordinated from the primary report.
            </p>
            <button
              onClick={handleGoToMaster}
              className="text-[11px] font-black text-amber-650 hover:text-amber-700 dark:text-emerald-450 dark:hover:text-emerald-400 underline cursor-pointer bg-transparent border-0 p-0 block pt-1"
            >
              Go to Primary Master Incident →
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Ticket Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6 text-slate-800 dark:text-slate-200">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Edit Incident Report</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Modify the title, description, or media attachments for this report.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1.5">Incident Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                      placeholder="e.g. Broken water pipe..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      rows={5}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none focus:bg-white dark:focus:bg-slate-900"
                      placeholder="Describe the issue in detail..."
                      required
                    />
                  </div>

                  <ImageUploader
                    attachments={editAttachments}
                    onAddAttachment={(type, url) => setEditAttachments(prev => [...prev, { type, url }])}
                    onRemoveAttachment={(index) => setEditAttachments(prev => prev.filter((_, idx) => idx !== index))}
                    dragActive={editDragActive}
                    onDrag={handleEditDrag}
                    onDrop={handleEditDrop}
                    onFileChange={handleEditFileChange}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                    }}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 text-slate-655 dark:text-slate-350 font-semibold rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer border-0 shadow-sm"
                  >
                    Save Incident Details
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Image/Media Carousel */}
                <div className="relative">
                  <MediaCarousel 
                    attachments={issue.mediaAttachments}
                    fallbackUrl={issue.imageUrl}
                    aspectRatioClassName="aspect-video md:aspect-[21/9]"
                  />
                  <div className="absolute top-4 left-4 flex space-x-2 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider border border-white/20 bg-slate-900/85 backdrop-blur text-white shadow">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        issue.severity === 'Critical' ? 'bg-rose-500 animate-pulse' :
                        issue.severity === 'High' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      {issue.severity.toUpperCase()} SEVERITY
                    </span>
                    <span className="bg-slate-900/85 backdrop-blur border border-white/20 text-white font-bold font-mono text-[10px] px-3 py-1 rounded-lg shadow uppercase">
                      #{issue.category}
                    </span>
                  </div>
                </div>

                {/* Title, reporter & location */}
                <div className="p-4 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-950 dark:text-slate-100 font-sans tracking-tight">
                      {issue.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <div 
                        className="flex items-center space-x-1.5 cursor-pointer hover:underline text-emerald-600 dark:text-emerald-500 font-semibold"
                        onClick={() => onViewUserProfile && onViewUserProfile(issue.reportedBy)}
                      >
                        <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        <span>Reported by {issue.reportedByName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>On {new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>{issue.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Citizen Description</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {issue.description}
                    </p>
                  </div>

                  {/* Status Timeline Progress Bar */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">Incident Progress Lifecycle</h3>
                    
                    <div className="relative flex items-center justify-between">
                      {/* Background line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
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
                              isCompleted ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                            } ${isActive ? 'ring-4 ring-emerald-500/15 scale-110' : ''}`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className="text-[6px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-2 tracking-wide uppercase max-w-[65px] text-center leading-tight">
                              {step.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resolution Info if available */}
                  {issue.status === 'RESOLVED' && (
                    <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                        <span className="font-bold text-emerald-900 text-sm">Resolution Proof & Verification</span>
                      </div>
                      {issue.resolutionImageUrl && (
                        <img 
                          src={issue.resolutionImageUrl} 
                          alt="Resolution Proof" 
                          className="w-full max-h-60 object-cover rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-sm"
                        />
                      )}
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-line">
                        <strong className="block text-emerald-900 dark:text-emerald-400 font-bold mb-0.5">Assigned Resolver Note:</strong>
                        {issue.resolutionNote || 'The designated plumbing or municipal repairs completed. Issue marked resolved.'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Citizen comments & verification timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              <span>Verifications & Local Log ({filteredVerifications.length})</span>
            </h3>

            <div className="space-y-4">
              {filteredVerifications.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No verifications or feedback reported yet for this incident.</p>
              ) : (
                filteredVerifications.map(v => (
                  <div key={v.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <span 
                          className="font-bold text-slate-905 dark:text-slate-100 cursor-pointer hover:underline"
                          onClick={() => onViewUserProfile && onViewUserProfile(v.userId)}
                        >
                          {v.userName}
                        </span>
                        <span className="text-slate-400 dark:text-slate-555">•</span>
                        <span className="text-slate-450 dark:text-slate-555">{new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        v.voteType === 'CONFIRM' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' :
                        v.voteType === 'FAKE' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                      }`}>
                        {v.voteType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{v.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Voting comment form */}
            {!issue.duplicateOfIssueId ? (
              <form onSubmit={handleVoteSubmit} className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">Add Your Verification Report</h4>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
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
                  <label className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
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
                  <label className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
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
                    className="flex-grow px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900"
                    required
                  />
                  <button 
                    id="vote-submit-btn"
                    type="submit"
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer border-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Vote</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-slate-250 dark:border-slate-800 pt-6 text-center text-slate-500 dark:text-slate-500 text-[11px] font-semibold italic">
                Verifications and comments are disabled on duplicate incidents.
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Scores & Actions Panel */}
        <div className="space-y-6">
          
          {/* Priority Score Summary */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Incident Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
                <span className="block text-2xl font-extrabold text-red-600">{issue.priorityScore}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">Priority Score</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
                <span className="block text-2xl font-extrabold text-emerald-600">{issue.trustScore}%</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">Trust Level</span>
              </div>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-400 text-xs">
              <div className="flex justify-between">
                <span>Confirm Votes</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{issue.verificationCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Flagged Fakes</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{issue.fakeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Confidence Rating</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{(issue.aiConfidence ? issue.aiConfidence * 100 : 80).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Reported Location Map Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center justify-between">
              <span>Incident Location Map</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">Zoom Active</span>
                {hasValidKey && (
                  <button
                    onClick={() => setMapProvider(prev => prev === 'google' ? 'osm' : 'google')}
                    className="text-[9px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold underline"
                  >
                    Use {mapProvider === 'google' ? 'OSM' : 'Google'}
                  </button>
                )}
              </div>
            </h3>
            
            <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
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
            
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Geolocated at {issue.city || 'local'} coordinate bounds: <strong className="text-slate-700 dark:text-slate-300 font-mono">{issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}</strong>. 
            </p>
          </div>

          {/* Gemini AI Summary Card */}
          {issue.aiSummary && (
            <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-emerald-50 p-4 sm:p-6 rounded-2xl border border-emerald-900 shadow-sm space-y-3.5">
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
          {isAuthorizedToResolve && (
            <>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Coordinating Actions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Only authorized Admin, Resolver, or Super Admin personnel may change ticket resolutions.</p>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>My Active Role: <strong>{currentUserRole}</strong></span>
                  </div>
                </div>

                {!issue.duplicateOfIssueId ? (
                  <button 
                    id="admin-panel-toggle"
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer border-0"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Toggle Admin Actions Console</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-455 dark:text-slate-500 text-center font-semibold italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-150/40 dark:border-slate-800/50">
                    Resolution options disabled on duplicate tickets.
                  </div>
                )}

                {/* Mark as Duplicate Section */}
                {isAuthorizedToDuplicate && onMarkAsDuplicate && issues && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Mark as Duplicate of...
                    </label>
                    {issue.duplicateOfIssueId ? (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-205 dark:border-slate-800">
                        <span className="text-[10px] text-slate-650 dark:text-slate-400 truncate max-w-[150px]">
                          Linked to master ticket
                        </span>
                        <button
                          type="button"
                          onClick={() => onMarkAsDuplicate(issue.id, null)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-transparent border-0 cursor-pointer"
                        >
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          id="select-duplicate-of"
                          defaultValue=""
                          onChange={(e) => {
                            const targetId = e.target.value;
                            if (targetId) {
                              onMarkAsDuplicate(issue.id, targetId);
                            }
                          }}
                          className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select master ticket...</option>
                          {issues
                            .filter(i => i.id !== issue.id && !i.duplicateOfIssueId)
                            .map(i => (
                              <option key={i.id} value={i.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                {i.title} ({i.city || currentUser?.city || 'Chandrapur'})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin action panel drawer details */}
              {showAdminPanel && (
                <form onSubmit={handleAdminFormSubmit} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4 animate-scale-up">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Resolve Ticket Details</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Update Ticket Status</label>
                    <select 
                      id="admin-select-status"
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value as IssueStatus)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="OPEN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">OPEN (Submitted)</option>
                      <option value="COMMUNITY_VERIFIED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">COMMUNITY_VERIFIED</option>
                      <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">IN_PROGRESS</option>
                      <option value="RESOLUTION_UPLOADED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">RESOLUTION_UPLOADED</option>
                      <option value="RESOLVED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">RESOLVED (Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Progress / Resolution Notes</label>
                    <textarea 
                      id="admin-textarea-notes"
                      rows={3}
                      placeholder="Explain actions taken, department feedback, plumbing logs, etc..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Resolution Image URL (Optional Proof)</label>
                    <input 
                      id="admin-input-image"
                      type="text" 
                      placeholder="e.g. paste repaired image .jpg link..."
                      value={adminResImg}
                      onChange={(e) => setAdminResImg(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono placeholder:text-slate-450 dark:placeholder:text-slate-600"
                    />
                  </div>

                  <button 
                    id="admin-submit-update-btn"
                    type="submit"
                    className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition-colors cursor-pointer border-0"
                  >
                    Apply Progress Update
                  </button>
                </form>
              )}
            </>
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

      <CustomModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Incident Report"
        message="Are you sure you want to permanently delete this incident report? This action is irreversible and will remove all comments, verifications, and feed posts related to it."
        type="confirm"
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}
