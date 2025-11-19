import React, { useState, useEffect } from 'react';
import { Agent, ChatMode } from '../types';

interface FocusGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ChatMode; // INDIVIDUAL or FOCUS_GROUP
  agents: Agent[];
  onCreate: (name: string, selectedAgentIds: string[]) => void;
}

const FocusGroupModal: React.FC<FocusGroupModalProps> = ({ isOpen, onClose, mode, agents, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isIndividual = mode === ChatMode.INDIVIDUAL;

  useEffect(() => {
    if (isOpen) {
      setGroupName(isIndividual ? 'New Chat' : `Focus Group ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setSelectedIds([]); 
    }
  }, [isOpen, mode]);

  const toggleAgent = (id: string) => {
    if (isIndividual) {
        setSelectedIds([id]);
    } else {
        setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }
  };

  const handleCreate = () => {
    if (selectedIds.length === 0) {
        alert("Please select an agent.");
        return;
    }
    const finalName = isIndividual ? `Chat with ${agents.find(a => a.id === selectedIds[0])?.name}` : groupName;
    onCreate(finalName, selectedIds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neo-bg dark:bg-neutral-900 border-3 border-black w-full max-w-3xl max-h-[90vh] flex flex-col shadow-neo-xl bg-pattern">
        
        {/* Header */}
        <div className="p-6 border-b-3 border-black flex justify-between items-center bg-white dark:bg-neutral-800 z-10">
          <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-3 uppercase tracking-tighter">
            <div className="w-12 h-12 bg-neo-primary border-2 border-black flex items-center justify-center shadow-neo-sm">
               <i className={`fa-solid ${isIndividual ? 'fa-user-plus' : 'fa-users-viewfinder'} text-white`}></i>
            </div>
            {isIndividual ? 'Start New Chat' : 'Create Focus Group'}
          </h2>
          <button onClick={onClose} className="w-10 h-10 bg-white border-2 border-black hover:bg-red-500 hover:text-white shadow-neo-sm flex items-center justify-center text-black transition-colors">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
            
            {/* Name Input (Focus Group Only) */}
            {!isIndividual && (
                <div className="mb-6">
                    <label className="block text-xs font-black text-black dark:text-white uppercase mb-2 bg-yellow-300 inline-block px-1 border border-black">Group Name</label>
                    <input 
                        type="text" 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 border-2 border-black p-3 text-sm font-bold outline-none focus:shadow-neo transition-shadow text-black dark:text-white"
                        placeholder="e.g. Marketing Strategy Huddle"
                        autoFocus
                    />
                </div>
            )}

            {/* Agent Selection */}
            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-3 flex justify-between items-center">
                    <span className="bg-white inline-block px-1 border border-black">Select {isIndividual ? 'Agent' : `Agents (${selectedIds.length})`}</span>
                    {selectedIds.length === 0 && <span className="text-red-500 font-bold text-[10px] uppercase bg-white px-1 border border-black">* Required</span>}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map(agent => {
                        const isSelected = selectedIds.includes(agent.id);
                        return (
                            <button 
                                key={agent.id}
                                onClick={() => toggleAgent(agent.id)}
                                className={`flex items-center gap-3 p-3 border-2 border-black text-left transition-all duration-200 relative overflow-hidden group hover:-translate-y-1 hover:shadow-neo-sm ${isSelected ? 'bg-blue-100 dark:bg-neutral-700 shadow-neo-sm' : 'bg-white dark:bg-neutral-800'}`}
                            >
                                <div className={`w-10 h-10 border-2 border-black flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden ${agent.avatarColor}`}>
                                    {agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black uppercase text-black dark:text-white truncate">{agent.name}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase truncate">{agent.role}</p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 text-green-500">
                                        <i className="fa-solid fa-check-circle text-lg bg-white rounded-full border-2 border-black"></i>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t-3 border-black flex justify-end gap-3 bg-white dark:bg-neutral-800">
            <button onClick={onClose} className="px-4 py-2 text-black dark:text-white font-bold hover:underline uppercase text-sm">Cancel</button>
            <button 
                onClick={handleCreate}
                disabled={selectedIds.length === 0 || (!isIndividual && !groupName.trim())}
                className="px-6 py-3 bg-neo-accent text-black border-2 border-black font-black uppercase shadow-neo hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <i className={`fa-solid ${isIndividual ? 'fa-comments' : 'fa-plus'}`}></i> {isIndividual ? 'Start Chat' : 'Create Group'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default FocusGroupModal;