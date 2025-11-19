
import React, { useState } from 'react';
import { Agent, ChatMode, ChatSession } from '../types';

interface SidebarProps {
  agents: Agent[];
  selectedAgents: string[];
  chatMode: ChatMode;
  viewMode: 'CHAT' | 'KANBAN';
  sessions: ChatSession[]; 
  currentSessionId: string; 
  isMobileOpen: boolean; 
  onCloseMobile: () => void; 
  onSelectAgent: (id: string) => void;
  onSetMode: (mode: ChatMode) => void;
  onSetViewMode: (mode: 'CHAT' | 'KANBAN') => void;
  onSelectSession: (id: string) => void; 
  onCreateSession: (mode: ChatMode) => void; 
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
  onToggleKnowledgeBase: () => void;
  onOpenHowToUse: () => void;
  onOpenDirectives: () => void;
  onOpenAnalytics: () => void;
  onLogout: () => void;
  onEditAgent: (agent: Agent) => void;
  onAddAgent: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  agents,
  selectedAgents,
  chatMode,
  viewMode,
  sessions,
  currentSessionId,
  isMobileOpen,
  onCloseMobile,
  onSelectAgent,
  onSetMode,
  onSetViewMode,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onToggleKnowledgeBase,
  onOpenHowToUse,
  onOpenDirectives,
  onOpenAnalytics,
  onLogout,
  onEditAgent,
  onAddAgent,
  isDarkMode,
  onToggleTheme
}) => {
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const handleAgentClick = (agentId: string) => onSelectAgent(agentId);

  const startEditingSession = (session: ChatSession, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      setEditingSessionId(session.id);
      setEditSessionTitle(session.title);
      setDeleteConfirmationId(null);
  };

  const saveSessionTitle = () => {
      if (editingSessionId && editSessionTitle.trim()) onRenameSession(editingSessionId, editSessionTitle);
      setEditingSessionId(null); setEditSessionTitle('');
  };

  const handleKeyDownSession = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveSessionTitle();
      if (e.key === 'Escape') setEditingSessionId(null);
  };
  
  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      setDeleteConfirmationId(sessionId);
  };

  const confirmDelete = (sessionId: string) => {
      onDeleteSession(sessionId);
      setDeleteConfirmationId(null);
  };

  const containerClasses = isMobileOpen
    ? "fixed inset-y-0 left-0 w-72 bg-neo-paper dark:bg-neutral-900 z-50 transform translate-x-0 transition-transform duration-300 border-r-3 border-black"
    : "w-72 bg-neo-paper dark:bg-neutral-900 border-r-3 border-black flex-col h-full z-20 hidden md:flex transition-colors duration-300";

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <>
    {isMobileOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={onCloseMobile}></div>)}

    <div className={`${containerClasses} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b-3 border-black flex items-center justify-between bg-neo-primary">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center border-2 border-white shadow-sm transform -rotate-3">
                <i className="fa-solid fa-atom text-sm"></i>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-black uppercase">Nexus<span className="text-white">OS</span></h1>
        </div>
        {isMobileOpen && (
            <button onClick={onCloseMobile} className="text-black border-2 border-black bg-white px-2 hover:bg-red-500 hover:text-white transition-colors">
                <i className="fa-solid fa-times"></i>
            </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
        
        {/* View Switcher */}
        <div className="mb-6 border-2 border-black p-1 bg-white dark:bg-black shadow-neo-sm">
          <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={() => onSetViewMode('CHAT')}
                className={`text-xs font-bold py-2 uppercase border-2 transition-all ${viewMode === 'CHAT' ? 'bg-neo-accent border-black text-black shadow-neo-sm' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                  Chat
              </button>
              <button 
                onClick={() => onSetViewMode('KANBAN')}
                className={`text-xs font-bold py-2 uppercase border-2 transition-all ${viewMode === 'KANBAN' ? 'bg-neo-accent border-black text-black shadow-neo-sm' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                  Tasks
              </button>
          </div>
        </div>

        {viewMode === 'CHAT' && (
        <>
        <div className="mb-6">
          <h3 className="text-xs font-black border-b-2 border-black mb-2 inline-block bg-black text-white px-1 uppercase">Start</h3>
          <div className="space-y-2">
            {[
                { mode: ChatMode.INDIVIDUAL, icon: 'fa-user', label: 'Individual', color: 'bg-neo-blue' },
                { mode: ChatMode.FOCUS_GROUP, icon: 'fa-users', label: 'Focus Group', color: 'bg-neo-pink' },
                { mode: ChatMode.WHOLE_SUITE, icon: 'fa-building', label: 'Whole Suite', color: 'bg-neo-secondary' }
            ].map(opt => (
                <button 
                    key={opt.mode}
                    onClick={() => onCreateSession(opt.mode)}
                    className={`w-full text-left px-3 py-2 border-2 border-black flex items-center gap-3 hover:shadow-neo-sm hover:-translate-y-0.5 transition-all bg-white dark:bg-neutral-800 group`}
                >
                    <div className={`w-6 h-6 ${opt.color} border-2 border-black flex items-center justify-center text-black text-xs`}>
                        <i className={`fa-solid ${opt.icon}`}></i>
                    </div>
                    <span className="text-sm font-bold uppercase text-black dark:text-white">{opt.label}</span>
                </button>
            ))}
          </div>

            <h3 className="text-xs font-black border-b-2 border-black mb-2 mt-6 inline-block bg-black text-white px-1 uppercase">History</h3>
            <div className="space-y-2 mb-6">
                {sessions.slice(0, 10).map(session => (
                    <div key={session.id} className="group relative">
                        {editingSessionId === session.id ? (
                            <div className="px-2 py-1 border-2 border-neo-primary bg-white flex items-center gap-2 shadow-neo-sm">
                                <input 
                                    type="text" 
                                    value={editSessionTitle}
                                    onChange={(e) => setEditSessionTitle(e.target.value)}
                                    onKeyDown={handleKeyDownSession}
                                    className="bg-transparent outline-none text-xs w-full font-bold text-black"
                                    autoFocus
                                    onBlur={saveSessionTitle}
                                />
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => onSelectSession(session.id)}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 border-2 transition-all relative pr-14 ${currentSessionId === session.id ? 'bg-black text-white border-black shadow-neo-sm' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-transparent hover:border-black'}`}
                                >
                                    <span className="font-bold truncate flex-1">{session.title}</span>
                                </button>
                                
                                {/* Action Overlay */}
                                {deleteConfirmationId === session.id ? (
                                    <div className="absolute inset-0 z-20 bg-red-500 border-2 border-black flex items-center justify-between px-2">
                                        <span className="text-[10px] text-white font-bold uppercase">Delete?</span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(session.id); }} className="text-xs font-black text-white hover:underline">Y</button>
                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmationId(null); }} className="text-xs font-black text-white hover:underline">N</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 z-10">
                                        <button onClick={(e) => startEditingSession(session, e)} className="w-5 h-5 bg-yellow-400 border-2 border-black flex items-center justify-center hover:bg-yellow-500"><i className="fa-solid fa-pencil text-[10px] text-black"></i></button>
                                        <button onClick={(e) => handleDeleteClick(session.id, e)} className="w-5 h-5 bg-red-400 border-2 border-black flex items-center justify-center hover:bg-red-500"><i className="fa-solid fa-trash text-[10px] text-black"></i></button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-1">
              <h3 className="text-xs font-black bg-black text-white px-1 uppercase">Agents</h3>
              <button onClick={onAddAgent} className="text-xs font-bold bg-neo-primary text-white px-2 py-0.5 border-2 border-black hover:shadow-neo-sm transition-all">+</button>
          </div>
          <div className="space-y-2">
            {agents.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              return (
                <div key={agent.id} className="group relative">
                    <button
                    onClick={() => handleAgentClick(agent.id)}
                    className={`w-full text-left px-2 py-1.5 flex items-center gap-3 transition-all border-2 ${isSelected ? 'bg-white border-black shadow-neo-sm' : 'border-transparent hover:border-gray-300'}`}
                    >
                    <div className={`w-8 h-8 border-2 border-black flex items-center justify-center text-xs text-white font-bold shadow-sm ${agent.avatarColor}`}>
                        {agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-black dark:text-white truncate leading-tight">{agent.name}</p>
                        <p className="text-[10px] font-medium uppercase text-gray-500 truncate">{agent.role}</p>
                    </div>
                    {isSelected && <div className="w-2 h-2 bg-green-500 border border-black"></div>}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEditAgent(agent); }}
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-yellow-300 z-10"
                    >
                        <i className="fa-solid fa-pen text-[10px] text-black"></i>
                    </button>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}

        {/* Resources */}
        <div className="mb-6">
             <h3 className="text-xs font-black border-b-2 border-black mb-2 inline-block bg-black text-white px-1 uppercase">Tools</h3>
             <div className="space-y-1">
                 {[
                     { icon: 'fa-database', label: 'Knowledge Base', color: 'text-yellow-600', action: onToggleKnowledgeBase },
                     { icon: 'fa-clipboard-list', label: 'Directives', color: 'text-green-600', action: onOpenDirectives },
                     { icon: 'fa-chart-pie', label: 'Analytics', color: 'text-purple-600', action: onOpenAnalytics },
                     { icon: 'fa-circle-question', label: 'Manual', color: 'text-blue-600', action: onOpenHowToUse }
                 ].map((item, i) => (
                    <button key={i} onClick={item.action} className="w-full text-left px-3 py-2 border border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm transition-all flex items-center gap-3 group">
                        <i className={`fa-solid ${item.icon} ${item.color} text-xs w-4`}></i>
                        <span className="text-sm font-bold dark:text-gray-300 dark:group-hover:text-black">{item.label}</span>
                    </button>
                 ))}
             </div>
        </div>
      </div>

      <div className="p-4 border-t-3 border-black bg-gray-100 dark:bg-neutral-800">
        <div className="flex flex-col gap-2">
            <button onClick={onToggleTheme} className="w-full border-2 border-black bg-white dark:bg-black text-black dark:text-white py-1 text-xs font-bold uppercase hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i> {isDarkMode ? 'Light' : 'Dark'}
            </button>
            <button onClick={onLogout} className="w-full border-2 border-black bg-red-500 text-white py-1 text-xs font-bold uppercase hover:bg-red-600 shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                Log Out
            </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
