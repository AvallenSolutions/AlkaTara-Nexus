
import React from 'react';
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
  
  const handleAgentClick = (agentId: string) => {
    if (chatMode === ChatMode.INDIVIDUAL) {
      onSelectAgent(agentId);
    } else {
      onSelectAgent(agentId);
    }
  };

  // Determine styles for mobile overlay vs desktop sidebar
  const containerClasses = isMobileOpen
    ? "fixed inset-y-0 left-0 w-72 bg-white dark:bg-avallen-800 shadow-2xl z-50 transform translate-x-0 transition-transform duration-300 border-r border-gray-200 dark:border-avallen-700"
    : "w-72 bg-white dark:bg-avallen-800 border-r border-gray-200 dark:border-avallen-700 flex-col h-full shadow-xl z-20 hidden md:flex transition-colors duration-300";

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <>
    {/* Mobile Backdrop */}
    {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onCloseMobile}></div>
    )}

    <div className={`${containerClasses} flex flex-col h-full`}>
      <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-avallen-accent rounded-lg flex items-center justify-center shadow-lg shadow-avallen-accent/20">
                <i className="fa-solid fa-atom text-white text-sm"></i>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">AlkaTara<span className="text-avallen-accent">.Nexus</span></h1>
        </div>
        {isMobileOpen && (
            <button onClick={onCloseMobile} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <i className="fa-solid fa-times"></i>
            </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
        
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onSetViewMode('CHAT')}
                className={`text-xs py-2 rounded border transition-colors ${viewMode === 'CHAT' ? 'bg-gray-100 dark:bg-avallen-700 text-gray-900 dark:text-white border-gray-300 dark:border-avallen-600' : 'text-gray-500 dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-avallen-700/30'}`}
              >
                  <i className="fa-regular fa-comments mr-1"></i> Chat
              </button>
              <button 
                onClick={() => onSetViewMode('KANBAN')}
                className={`text-xs py-2 rounded border transition-colors ${viewMode === 'KANBAN' ? 'bg-gray-100 dark:bg-avallen-700 text-gray-900 dark:text-white border-gray-300 dark:border-avallen-600' : 'text-gray-500 dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-avallen-700/30'}`}
              >
                  <i className="fa-solid fa-list-check mr-1"></i> Tasks
              </button>
          </div>
        </div>

        {viewMode === 'CHAT' && (
        <>
        <div className="mb-6">
             <button 
                onClick={() => onCreateSession(chatMode)}
                className="w-full bg-avallen-accent/10 hover:bg-avallen-accent/20 text-avallen-accent dark:text-sky-400 border border-avallen-accent/20 dark:border-sky-500/30 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2 mb-4 transition-colors"
            >
                <i className="fa-solid fa-plus"></i> New Chat
            </button>

            <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">History</h3>
            <div className="space-y-1 mb-6">
                {sessions.slice(0, 5).map(session => (
                    <button 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`w-full text-left px-3 py-2 rounded text-xs truncate flex items-center gap-2 transition-colors ${currentSessionId === session.id ? 'bg-gray-100 dark:bg-avallen-700 text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-avallen-700/50'}`}
                    >
                        <i className={`fa-regular ${session.mode === ChatMode.WHOLE_SUITE ? 'fa-building' : session.mode === ChatMode.FOCUS_GROUP ? 'fa-users' : 'fa-comment'} text-[10px]`}></i>
                        <span className="truncate flex-1">{session.title}</span>
                        <span className="text-[9px] opacity-50">{formatDate(session.lastMessageAt)}</span>
                    </button>
                ))}
                {sessions.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-600 italic pl-2">No history yet.</p>}
            </div>

          <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Modes</h3>
          <div className="space-y-1">
            <button 
              onClick={() => onSetMode(ChatMode.INDIVIDUAL)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${chatMode === ChatMode.INDIVIDUAL ? 'bg-gray-100 dark:bg-avallen-700 text-avallen-accent' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50'}`}
            >
              <i className="fa-solid fa-user text-xs w-4"></i>
              <span className="text-sm font-medium">Individual</span>
            </button>
            <button 
              onClick={() => onSetMode(ChatMode.FOCUS_GROUP)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${chatMode === ChatMode.FOCUS_GROUP ? 'bg-gray-100 dark:bg-avallen-700 text-avallen-accent' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50'}`}
            >
              <i className="fa-solid fa-users text-xs w-4"></i>
              <span className="text-sm font-medium">Focus Group</span>
            </button>
            <button 
              onClick={() => onSetMode(ChatMode.WHOLE_SUITE)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${chatMode === ChatMode.WHOLE_SUITE ? 'bg-gray-100 dark:bg-avallen-700 text-avallen-accent' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50'}`}
            >
              <i className="fa-solid fa-building text-xs w-4"></i>
              <span className="text-sm font-medium">Whole C-Suite</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Agents</h3>
              <button onClick={onAddAgent} className="text-[10px] text-avallen-accent hover:underline">Add</button>
          </div>
          <div className="space-y-1">
            {agents.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              return (
                <div key={agent.id} className="group relative">
                    <button
                    onClick={() => handleAgentClick(agent.id)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${isSelected ? 'bg-gray-100 dark:bg-avallen-700' : 'hover:bg-gray-50 dark:hover:bg-avallen-700/50'}`}
                    >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${agent.avatarColor} overflow-hidden border border-gray-200 dark:border-avallen-600`}>
                        {agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>{agent.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{agent.role}</p>
                    </div>
                    {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    )}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEditAgent(agent); }}
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-avallen-accent bg-white dark:bg-avallen-800 p-1 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                        title="Edit Agent"
                    >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}

        {/* Shared Resources - Always Visible */}
        <div className="mb-6">
             <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Resources</h3>
             <button onClick={onToggleKnowledgeBase} className="w-full text-left px-3 py-2 rounded flex items-center gap-3 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50 transition-colors">
                 <i className="fa-solid fa-database text-yellow-500 text-xs w-4"></i>
                 <span className="text-sm">Knowledge Base</span>
             </button>
             <button onClick={onOpenDirectives} className="w-full text-left px-3 py-2 rounded flex items-center gap-3 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50 transition-colors">
                 <i className="fa-solid fa-clipboard-list text-green-500 text-xs w-4"></i>
                 <span className="text-sm">Directives</span>
             </button>
             <button onClick={onOpenAnalytics} className="w-full text-left px-3 py-2 rounded flex items-center gap-3 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50 transition-colors">
                 <i className="fa-solid fa-chart-pie text-purple-500 text-xs w-4"></i>
                 <span className="text-sm">Analytics</span>
             </button>
             <button onClick={onOpenHowToUse} className="w-full text-left px-3 py-2 rounded flex items-center gap-3 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-avallen-700/50 transition-colors">
                 <i className="fa-solid fa-circle-question text-blue-500 text-xs w-4"></i>
                 <span className="text-sm">How to Use</span>
             </button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-avallen-700">
        <div className="flex items-center justify-between text-gray-500 dark:text-slate-400">
            <button onClick={onToggleTheme} className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 text-xs">
                <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button onClick={onLogout} className="hover:text-red-500 transition-colors text-xs font-bold">
                Log Out
            </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
