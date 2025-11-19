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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 border-3 border-black w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-neo-xl flex flex-col">
         
         <div className="p-6 border-b-3 border-black flex justify-between items-center bg-neo-paper dark:bg-neutral-800">
            <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-3 uppercase tracking-tighter">
               <div className="w-10 h-10 bg-green-500 border-2 border-black flex items-center justify-center shadow-neo-sm">
                 <i className="fa-solid fa-gavel text-white"></i>
               </div>
               Agent Directives
            </h2>
            <button onClick={onClose} className="w-8 h-8 bg-white border-2 border-black hover:bg-red-500 hover:text-white shadow-neo-sm flex items-center justify-center text-black">
               <i className="fa-solid fa-times text-lg"></i>
            </button>
         </div>

         <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-pattern">
            <div className="bg-blue-100 border-2 border-black p-4 shadow-neo text-sm font-bold text-black">
                <i className="fa-solid fa-circle-info mr-2 text-blue-600"></i>
                Directives are global "LAWS" that all agents must follow. They override individual personas.
            </div>

            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-2 bg-yellow-300 inline-block px-1 border border-black">Add New Directive</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newDirective} 
                        onChange={(e) => setNewDirective(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="e.g. Always verify sources..." 
                        className="flex-1 bg-white dark:bg-neutral-800 border-2 border-black p-3 text-sm font-medium outline-none focus:shadow-neo transition-shadow"
                    />
                    <button onClick={handleAdd} className="bg-black text-white px-6 py-2 font-black border-2 border-black shadow-neo hover:bg-gray-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase">
                        Add
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-2 bg-white inline-block px-1 border border-black">Active Directives</label>
                {directives.length === 0 && (
                    <div className="text-gray-500 text-sm font-bold text-center py-4 border-2 border-dashed border-black bg-white/50">NO LAWS DEFINED.</div>
                )}
                <div className="space-y-3">
                    {directives.map(d => (
                        <div key={d.id} className={`flex items-start gap-3 p-3 border-2 border-black transition-all ${d.active ? 'bg-white shadow-neo-sm' : 'bg-gray-200 opacity-60'}`}>
                            <button onClick={() => handleToggle(d)} className={`mt-1 w-6 h-6 flex items-center justify-center border-2 border-black transition-colors ${d.active ? 'bg-green-500 text-white' : 'bg-white'}`}>
                                {d.active && <i className="fa-solid fa-check text-xs"></i>}
                            </button>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${d.active ? 'text-black' : 'text-gray-500 line-through'}`}>{d.content}</p>
                            </div>
                            <button onClick={() => onDeleteDirective(d.id)} className="w-6 h-6 bg-red-500 border-2 border-black flex items-center justify-center text-white hover:bg-red-600 shadow-sm">
                                <i className="fa-solid fa-trash text-xs"></i>
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