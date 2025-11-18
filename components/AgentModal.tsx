
import React, { useState, useEffect } from 'react';
import { Agent } from '../types';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
  onDelete?: (agentId: string) => void;
  initialAgent?: Agent | null;
}

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, onSave, onDelete, initialAgent }) => {
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    surname: '',
    role: '',
    expertise: '',
    systemInstruction: '',
    backstory: '',
    avatarUrl: '',
    avatarColor: 'bg-slate-600'
  });

  useEffect(() => {
    if (isOpen) {
        if (initialAgent) {
            setFormData({ ...initialAgent });
        } else {
            // Reset for new agent
            setFormData({
                name: '',
                surname: '',
                role: '',
                expertise: '',
                systemInstruction: '',
                backstory: '',
                avatarUrl: '',
                avatarColor: 'bg-slate-600'
            });
        }
    }
  }, [isOpen, initialAgent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    const agentToSave: Agent = {
      id: initialAgent?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      surname: formData.surname || '',
      role: formData.role,
      expertise: formData.expertise || '',
      systemInstruction: formData.systemInstruction || 'You are a helpful AI assistant.',
      backstory: formData.backstory || '',
      avatarUrl: formData.avatarUrl,
      avatarColor: formData.avatarColor || 'bg-slate-600',
      isCustom: true
    };
    
    onSave(agentToSave);
    onClose();
  };

  const handleDelete = () => {
      if (initialAgent && onDelete && window.confirm(`Are you sure you want to delete ${initialAgent.name}? This cannot be undone.`)) {
          onDelete(initialAgent.id);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-600 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center sticky top-0 bg-white dark:bg-avallen-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialAgent ? 'Edit Agent Profile' : 'Create New Agent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">First Name</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none"
                        placeholder="e.g. Sarah"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Surname</label>
                    <input 
                        type="text" 
                        value={formData.surname}
                        onChange={e => setFormData({...formData, surname: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none"
                        placeholder="e.g. Connor"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Role / Title</label>
                <input 
                    type="text" 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none"
                    placeholder="e.g. Head of Security"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Avatar URL (Optional)</label>
                <input 
                    type="text" 
                    value={formData.avatarUrl}
                    onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none"
                    placeholder="https://..."
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Leave blank for default initial.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Core Expertise</label>
                <textarea 
                    value={formData.expertise}
                    onChange={e => setFormData({...formData, expertise: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none h-20 resize-none"
                    placeholder="List skills, tools, and knowledge areas..."
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Backstory</label>
                <textarea 
                    value={formData.backstory}
                    onChange={e => setFormData({...formData, backstory: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none h-24"
                    placeholder="Give the agent a history, personality quirks, and background..."
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">System Instruction (Advanced)</label>
                <textarea 
                    value={formData.systemInstruction}
                    onChange={e => setFormData({...formData, systemInstruction: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-avallen-900/50 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white focus:border-avallen-accent outline-none h-32 font-mono text-xs"
                    placeholder="Detailed instructions on how the agent should behave..."
                />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-avallen-700 flex justify-end gap-3">
                {initialAgent && onDelete && (
                    <button 
                        type="button"
                        onClick={handleDelete}
                        className="mr-auto px-4 py-2 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-sm border border-red-200 dark:border-transparent"
                    >
                        Delete Agent
                    </button>
                )}
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className="px-6 py-2 bg-avallen-accent text-white font-bold rounded shadow-lg shadow-avallen-accent/20 hover:bg-sky-400 transition-colors text-sm"
                >
                    {initialAgent ? 'Save Changes' : 'Create Agent'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AgentModal;