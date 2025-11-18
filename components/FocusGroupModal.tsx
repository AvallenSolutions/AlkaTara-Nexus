
import React, { useState, useEffect } from 'react';
import { Agent } from '../types';

interface FocusGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onCreate: (name: string, selectedAgentIds: string[]) => void;
}

const FocusGroupModal: React.FC<FocusGroupModalProps> = ({ isOpen, onClose, agents, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setGroupName(`Focus Group ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      // Default to selecting the first 2 agents if none selected, or just clear
      setSelectedIds([]); 
    }
  }, [isOpen]);

  const toggleAgent = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (selectedIds.length === 0) {
        alert("Please select at least one agent.");
        return;
    }
    onCreate(groupName, selectedIds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-600 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl transition-colors duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center bg-white dark:bg-avallen-800 z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-avallen-accent rounded-lg flex items-center justify-center shadow-lg shadow-avallen-accent/20">
               <i className="fa-solid fa-users-viewfinder text-white"></i>
            </div>
            Create Focus Group
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
            
            {/* Name Input */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Group Name</label>
                <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent font-medium"
                    placeholder="e.g. Marketing Strategy Huddle"
                    autoFocus
                />
            </div>

            {/* Agent Selection */}
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-3 flex justify-between">
                    <span>Select Agents ({selectedIds.length})</span>
                    {selectedIds.length === 0 && <span className="text-red-400 italic font-normal normal-case">* Select at least one</span>}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {agents.map(agent => {
                        const isSelected = selectedIds.includes(agent.id);
                        return (
                            <button 
                                key={agent.id}
                                onClick={() => toggleAgent(agent.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group ${isSelected ? 'bg-blue-50 dark:bg-avallen-700 border-avallen-accent ring-1 ring-avallen-accent' : 'bg-white dark:bg-avallen-900 border-gray-200 dark:border-avallen-700 hover:border-gray-300 dark:hover:border-avallen-600'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden ${agent.avatarColor}`}>
                                    {agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-avallen-accent' : 'text-gray-900 dark:text-white'}`}>{agent.name}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{agent.role}</p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 text-avallen-accent">
                                        <i className="fa-solid fa-check-circle"></i>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-avallen-700 flex justify-end gap-3 bg-gray-50 dark:bg-avallen-900 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">Cancel</button>
            <button 
                onClick={handleCreate}
                disabled={selectedIds.length === 0 || !groupName.trim()}
                className="px-6 py-2 bg-avallen-accent hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg shadow-avallen-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <i className="fa-solid fa-plus"></i> Create Focus Group
            </button>
        </div>

      </div>
    </div>
  );
};

export default FocusGroupModal;
