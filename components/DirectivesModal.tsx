
import React, { useState } from 'react';
import { Directive } from '../types';

interface DirectivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  directives: Directive[];
  onSaveDirective: (d: Directive) => void;
  onDeleteDirective: (id: string) => void;
}

const DirectivesModal: React.FC<DirectivesModalProps> = ({ isOpen, onClose, directives, onSaveDirective, onDeleteDirective }) => {
  const [newDirective, setNewDirective] = useState('');
  
  if (!isOpen) return null;

  const handleAdd = () => {
      if (!newDirective.trim()) return;
      onSaveDirective({
          id: Math.random().toString(36).substr(2, 9),
          content: newDirective.trim(),
          active: true,
          createdAt: Date.now()
      });
      setNewDirective('');
  };

  const handleToggle = (d: Directive) => {
      onSaveDirective({ ...d, active: !d.active });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-600 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors duration-300">
         
         <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center sticky top-0 bg-white dark:bg-avallen-800 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
               <i className="fa-solid fa-clipboard-list text-avallen-accent"></i>
               Agent Directives
            </h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors">
               <i className="fa-solid fa-times text-xl"></i>
            </button>
         </div>

         <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="bg-blue-50 dark:bg-avallen-900/50 border border-blue-100 dark:border-avallen-700 p-4 rounded-lg text-sm text-gray-700 dark:text-slate-300">
                <i className="fa-solid fa-circle-info text-avallen-accent mr-2"></i>
                Directives are global rules that <strong>all agents must follow</strong>. They override individual personas. Use them to enforce specific company policies, tone of voice, or prohibited topics.
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Add New Directive</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newDirective} 
                        onChange={(e) => setNewDirective(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="e.g. Always mention the user's name in the first sentence..." 
                        className="flex-1 bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:border-avallen-accent focus:ring-1 focus:ring-avallen-accent"
                    />
                    <button onClick={handleAdd} className="bg-avallen-accent hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                        <i className="fa-solid fa-plus"></i> Add
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Active Directives</label>
                {directives.length === 0 && (
                    <p className="text-gray-400 dark:text-slate-600 text-sm italic text-center py-4">No directives defined yet.</p>
                )}
                <div className="space-y-3">
                    {directives.map(d => (
                        <div key={d.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${d.active ? 'bg-white dark:bg-avallen-900 border-gray-200 dark:border-avallen-700' : 'bg-gray-100 dark:bg-avallen-900/30 border-transparent opacity-60'}`}>
                            <button onClick={() => handleToggle(d)} className={`mt-1 w-5 h-5 rounded flex items-center justify-center border ${d.active ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 dark:border-slate-600 text-transparent'}`}>
                                <i className="fa-solid fa-check text-xs"></i>
                            </button>
                            <div className="flex-1">
                                <p className={`text-sm ${d.active ? 'text-gray-800 dark:text-slate-200' : 'text-gray-500 dark:text-slate-500 line-through'}`}>{d.content}</p>
                            </div>
                            <button onClick={() => onDeleteDirective(d.id)} className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors">
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DirectivesModal;