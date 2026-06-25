import React, { useState } from 'react';
import { Search, Plus, MapPin, Users, Award, Building2, Eye } from 'lucide-react';
import { Community } from '../../../types';
import CustomModal from '../../../components/Modal';

interface CommunitiesListProps {
  communities: Community[];
  joinedIds: string[];
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onCreate: (community: Omit<Community, 'id' | 'memberIds' | 'reputationScore' | 'totalIssues' | 'resolvedIssues' | 'createdAt' | 'updatedAt'>) => void;
  selectedCommunityId: string;
  setSelectedCommunityId: (id: string) => void;
}

export default function CommunitiesList({
  communities,
  joinedIds,
  onJoin,
  onLeave,
  onCreate,
  selectedCommunityId,
  setSelectedCommunityId
}: CommunitiesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [newComm, setNewComm] = useState({
    name: '',
    type: 'Housing Society' as Community['type'],
    description: '',
    areaName: '',
    latitude: 18.5204,
    longitude: 73.8567,
    createdBy: 'user_1',
    adminIds: ['user_1']
  });

  // Filter list
  const filtered = communities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.areaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComm.name.trim() || !newComm.areaName.trim() || !newComm.description.trim()) {
      setAlertModalMessage('Please fill out all fields of the community space.');
      setAlertModalOpen(true);
      return;
    }
    onCreate(newComm);
    setShowCreateModal(false);
    setNewComm({
      name: '',
      type: 'Housing Society',
      description: '',
      areaName: '',
      latitude: 18.5204,
      longitude: 73.8567,
      createdBy: 'user_1',
      adminIds: ['user_1']
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Action banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">Community Spaces</h1>
          <p className="text-sm text-slate-500">Create, explore, or join neighborhood workspaces and cooperative zones.</p>
        </div>
        <button 
          id="btn-trigger-create-comm"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Community Space</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            id="search-communities-input"
            type="text" 
            placeholder="Search spaces by name, category, or locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto whitespace-nowrap py-1">
          <span className="text-xs text-slate-400 font-medium">Joined filter:</span>
          <button 
            id="filter-comm-joined"
            onClick={() => setSearchTerm('')} 
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            All Spaces ({communities.length})
          </button>
        </div>
      </div>

      {/* Grid of Communities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map(community => {
          const isJoined = joinedIds.includes(community.id);
          const isActive = selectedCommunityId === community.id;

          return (
            <div 
              key={community.id} 
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow ${
                isActive ? 'border-emerald-600 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="block text-base font-extrabold text-emerald-600 leading-none">{community.reputationScore}%</span>
                    <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Health Rating</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1 hover:text-emerald-600 cursor-pointer" onClick={() => setSelectedCommunityId(community.id)}>
                  {community.name}
                </h3>
                <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded mb-3">
                  {community.type}
                </span>

                <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                  {community.description}
                </p>

                <div className="space-y-2.5 border-t border-slate-100 pt-4 text-slate-500 text-xs font-medium">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{community.areaName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{community.memberIds.length + (isJoined && !community.memberIds.includes('user_1') ? 1 : 0)} Active Contributors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{community.resolvedIssues}/{community.totalIssues} Resolved Issues</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  id={`btn-toggle-active-${community.id}`}
                  onClick={() => setSelectedCommunityId(community.id)}
                  className={`text-xs font-bold flex items-center space-x-1 transition-colors ${
                    isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isActive ? 'Active Space' : 'View Space'}</span>
                </button>

                {isJoined ? (
                  <button 
                    id={`btn-leave-${community.id}`}
                    onClick={() => onLeave(community.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    Leave Space
                  </button>
                ) : (
                  <button 
                    id={`btn-join-${community.id}`}
                    onClick={() => onJoin(community.id)}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-all shadow-sm cursor-pointer"
                  >
                    Join Space
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-950">Establish New Community Space</h3>
              <button 
                id="btn-close-create-modal"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Space Name</label>
                <input 
                  id="modal-comm-name"
                  type="text" 
                  placeholder="e.g. Green Park Society, Ward 12"
                  value={newComm.name}
                  onChange={(e) => setNewComm({ ...newComm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Space Type</label>
                  <select 
                    id="modal-comm-type"
                    value={newComm.type}
                    onChange={(e) => setNewComm({ ...newComm, type: e.target.value as Community['type'] })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Housing Society">Housing Society</option>
                    <option value="Street">Street</option>
                    <option value="Ward">Ward</option>
                    <option value="Village">Village</option>
                    <option value="Campus">Campus</option>
                    <option value="Market">Market</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Locality / Area Name</label>
                  <input 
                    id="modal-comm-area"
                    type="text" 
                    placeholder="e.g. Aundh, Pune"
                    value={newComm.areaName}
                    onChange={(e) => setNewComm({ ...newComm, areaName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Workspace Description</label>
                <textarea 
                  id="modal-comm-desc"
                  rows={3}
                  placeholder="Describe the workspace boundary, members, and purpose of this civic space..."
                  value={newComm.description}
                  onChange={(e) => setNewComm({ ...newComm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-[11px] text-emerald-800 flex items-start space-x-2">
                <Users className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Creating a space registers you as the founder and primary administrator. You can approve members, update progress logs, and coordinate resolutions.</span>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  id="modal-cancel-btn"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="modal-create-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertModalMessage('');
        }}
        title="Validation Error"
        message={alertModalMessage}
        type="error"
      />
    </div>
  );
}
