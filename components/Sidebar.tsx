
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
  onOpenDirectives: () => void; // New
  onLogout: () => void;
  onEditAgent: (agent: Agent) => void;
  onAddAgent: () => void;
  isDarkMode: boolean; // New
  onToggleTheme: () => void; // New
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
                className="w-full bg-avallen-accent/10 hover:bg-avallen-accent/20 text-avallen-accent border border-avallen-accent/50 rounded-lg py-2 text-sm font-bold transition-all flex items-center justify-center gap-2 mb-4"
             >
                 <i className="fa-solid fa-plus"></i> New Chat
             </button>

             <h3 className="text-xs font-semibold text-gray-400 dark:text-avallen-400 uppercase tracking-wider mb-2 ml-2">Recent Sessions</h3>
             <div className="space-y-1 max-h-40 overflow-y-auto">
                 {sessions.map(s => (
                     <button
                        key={s.id}
                        onClick={() => onSelectSession(s.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs truncate transition-colors flex justify-between group ${currentSessionId === s.id ? 'bg-gray-200 dark:bg-avallen-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50'}`}
                     >
                        <span className="truncate">{s.title}</span>
                        <span className="text-[9px] text-gray-400 dark:text-slate-600 opacity-0 group-hover:opacity-100">{formatDate(s.lastMessageAt)}</span>
                     </button>
                 ))}
             </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-avallen-400 uppercase tracking-wider mb-2 ml-2">Chat Mode</h3>
          <div className="space-y-1">
            <button
              onClick={() => onSetMode(ChatMode.INDIVIDUAL)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 ${chatMode === ChatMode.INDIVIDUAL ? 'bg-gray-200 dark:bg-avallen-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50'}`}
            >
              <i className="fa-solid fa-user w-4 text-center"></i> Individual
            </button>
            <button
              onClick={() => onSetMode(ChatMode.FOCUS_GROUP)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 ${chatMode === ChatMode.FOCUS_GROUP ? 'bg-gray-200 dark:bg-avallen-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50'}`}
            >
              <i className="fa-solid fa-users w-4 text-center"></i> Focus Group
            </button>
            <button
              onClick={() => onSetMode(ChatMode.WHOLE_SUITE)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 ${chatMode === ChatMode.WHOLE_SUITE ? 'bg-gray-200 dark:bg-avallen-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50'}`}
            >
              <i className="fa-solid fa-building w-4 text-center"></i> Whole Suite
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 ml-2">
             <h3 className="text-xs font-semibold text-gray-400 dark:text-avallen-400 uppercase tracking-wider">Agents</h3>
             <button 
                onClick={onAddAgent}
                className="text-xs bg-gray-200 dark:bg-avallen-700 hover:bg-gray-300 dark:hover:bg-avallen-600 text-gray-700 dark:text-white px-2 py-1 rounded transition-colors shadow-sm"
                title="Create New Agent"
             >
                 <i className="fa-solid fa-plus mr-1"></i> Add
             </button>
          </div>
          
          <div className="space-y-1">
            {agents.map(agent => {
              const isSelected = selectedAgents.includes(agent.id);
              return (
                <div 
                    key={agent.id}
                    className={`group relative w-full rounded-md transition-all
                    ${isSelected 
                      ? 'bg-gray-200/80 dark:bg-avallen-700/80 border-l-2 border-avallen-accent' 
                      : 'hover:bg-gray-100 dark:hover:bg-avallen-700/30 border-l-2 border-transparent'}
                    ${chatMode === ChatMode.WHOLE_SUITE ? 'opacity-70' : ''}
                  `}
                >
                    <button
                        onClick={() => handleAgentClick(agent.id)}
                        disabled={chatMode === ChatMode.WHOLE_SUITE}
                        className="w-full text-left pl-3 pr-8 py-2 flex items-center gap-3"
                    >
                        <div className={`w-8 h-8 rounded-full ${agent.avatarColor} flex-shrink-0 flex items-center justify-center overflow-hidden border border-white dark:border-avallen-600 shadow-sm`}>
                            {agent.avatarUrl ? (
                                <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-white font-bold">{agent.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200'}`}>
                                {agent.name} {agent.surname}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{agent.role}</p>
                        </div>
                        {isSelected && chatMode === ChatMode.FOCUS_GROUP && <i className="fa-solid fa-check text-avallen-accent text-xs"></i>}
                    </button>
                    
                    {/* Edit Trigger */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEditAgent(agent); }}
                        className={`absolute right-1 top-2 p-1.5 rounded-md transition-colors z-10
                             ${isSelected 
                                ? 'text-avallen-accent hover:bg-gray-300 dark:hover:bg-avallen-600' 
                                : 'text-gray-400 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-avallen-600'}
                        `}
                        title="Edit Agent Details"
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

        <div>
           <h3 className="text-xs font-semibold text-gray-400 dark:text-avallen-400 uppercase tracking-wider mb-2 ml-2">Resources</h3>
           <div className="space-y-1">
             <button
                onClick={onToggleKnowledgeBase}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-3"
              >
                <i className="fa-solid fa-book-open w-4 text-yellow-500 text-center"></i> Knowledge Base
              </button>
              <button
                onClick={onOpenDirectives}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-3"
              >
                <i className="fa-solid fa-clipboard-list w-4 text-green-500 text-center"></i> Directives
              </button>
              <button
                onClick={onOpenHowToUse}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-avallen-700/50 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-3"
              >
                <i className="fa-solid fa-circle-info w-4 text-blue-400 text-center"></i> How to Use
              </button>
           </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-avallen-700">
         <div className="flex items-center justify-between mb-2">
             <span className="text-xs text-gray-400 dark:text-slate-500">Theme</span>
             <button 
                onClick={onToggleTheme} 
                className="bg-gray-200 dark:bg-avallen-700 rounded-full p-1 w-12 h-6 flex items-center transition-all relative"
             >
                 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform absolute ${isDarkMode ? 'translate-x-6 bg-avallen-900' : 'translate-x-0.5'}`}></div>
                 <i className={`fa-solid fa-sun text-[8px] absolute left-1.5 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`}></i>
                 <i className={`fa-solid fa-moon text-[8px] absolute right-1.5 ${isDarkMode ? 'text-blue-300' : 'text-gray-400'}`}></i>
             </button>
         </div>
        <button onClick={onLogout} className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full px-2 py-2">
          <i className="fa-solid fa-right-from-bracket w-4 text-center"></i> Sign Out
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;