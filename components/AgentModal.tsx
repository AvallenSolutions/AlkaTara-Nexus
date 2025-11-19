import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { generateSpeech } from '../services/geminiService';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
  onDelete?: (agentId: string) => void;
  initialAgent?: Agent | null;
}

const GEMINI_VOICES = [
    { name: 'Kore', gender: 'Female', style: 'Clear, Professional' },
    { name: 'Puck', gender: 'Male', style: 'Neutral, Approachable' },
    { name: 'Charon', gender: 'Male', style: 'Deep, Serious' },
    { name: 'Fenrir', gender: 'Male', style: 'Energetic, Strong' },
    { name: 'Zephyr', gender: 'Female', style: 'Soft, Calm' },
    { name: 'Aoede', gender: 'Female', style: 'Confident, Deep' },
    { name: 'Leda', gender: 'Female', style: 'Sophisticated' },
    { name: 'Iapetus', gender: 'Male', style: 'Calm, Resonant' },
    { name: 'Orus', gender: 'Male', style: 'Deep, Monotone' }
];

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, onSave, onDelete, initialAgent }) => {
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '', surname: '', role: '', expertise: '', systemInstruction: '', backstory: '', avatarUrl: '', avatarColor: 'bg-slate-600', voiceURI: 'Kore'
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialAgent) { setFormData({ ...initialAgent }); } 
        else { setFormData({ name: '', surname: '', role: '', expertise: '', systemInstruction: '', backstory: '', avatarUrl: '', avatarColor: 'bg-slate-600', voiceURI: 'Kore' }); }
        setIsDeleteConfirming(false);
    }
  }, [isOpen, initialAgent]);

  if (!isOpen) return null;

  const testVoice = async () => {
      if (isPlaying) return;
      setIsPlaying(true);
      const text = `Hello, I am ${formData.name || 'your agent'}. This is my voice.`;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await generateSpeech(text, formData.voiceURI || 'Kore', ctx);
      if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onended = () => setIsPlaying(false);
          source.start(0);
      } else { setIsPlaying(false); alert("Could not generate audio preview."); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;
    const agentToSave: Agent = {
      id: initialAgent?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name, surname: formData.surname || '', role: formData.role, expertise: formData.expertise || '',
      systemInstruction: formData.systemInstruction || 'You are a helpful AI assistant.',
      backstory: formData.backstory || '', avatarUrl: formData.avatarUrl, avatarColor: formData.avatarColor || 'bg-slate-600',
      voiceURI: formData.voiceURI, isCustom: true, gender: formData.gender
    };
    onSave(agentToSave); onClose();
  };

  const handleConfirmDelete = () => { if (initialAgent && onDelete) { onDelete(initialAgent.id); onClose(); } };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 border-3 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-neo-xl bg-pattern">
        
        <div className="p-6 border-b-3 border-black flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-800 z-10">
          <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-neo-secondary border-2 border-black flex items-center justify-center shadow-neo-sm text-white"><i className="fa-solid fa-robot"></i></div>
            {initialAgent ? 'Edit Profile' : 'New Agent'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 bg-white border-2 border-black hover:bg-red-500 hover:text-white shadow-neo-sm flex items-center justify-center text-black transition-colors">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-neutral-900">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-yellow-300 inline-block px-1 border border-black">First Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-black p-2 text-sm font-bold outline-none focus:shadow-neo transition-shadow bg-white dark:bg-neutral-800 text-black dark:text-white" required placeholder="NAME" />
                </div>
                <div>
                    <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-white dark:bg-neutral-800 inline-block px-1 border border-black">Surname</label>
                    <input type="text" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} className="w-full border-2 border-black p-2 text-sm font-bold outline-none focus:shadow-neo transition-shadow bg-white dark:bg-neutral-800 text-black dark:text-white" placeholder="SURNAME" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-yellow-300 inline-block px-1 border border-black">Role</label>
                    <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border-2 border-black p-2 text-sm font-bold outline-none focus:shadow-neo transition-shadow bg-white dark:bg-neutral-800 text-black dark:text-white" required placeholder="JOB TITLE" />
                </div>
                 <div>
                    <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-white dark:bg-neutral-800 inline-block px-1 border border-black">Gender</label>
                    <select value={formData.gender || 'male'} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full border-2 border-black p-2 text-sm font-bold outline-none focus:shadow-neo transition-shadow bg-white dark:bg-neutral-800 text-black dark:text-white">
                        <option value="male">Male</option><option value="female">Female</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-pink-300 inline-block px-1 border border-black">AI Voice</label>
                <div className="flex gap-2">
                    <select value={formData.voiceURI || 'Kore'} onChange={e => setFormData({...formData, voiceURI: e.target.value})} className="flex-1 border-2 border-black p-2 text-sm font-bold outline-none focus:shadow-neo transition-shadow bg-white dark:bg-neutral-800 text-black dark:text-white">
                        {GEMINI_VOICES.map(v => (<option key={v.name} value={v.name}>{v.name} ({v.gender} - {v.style})</option>))}
                    </select>
                    <button type="button" onClick={testVoice} disabled={isPlaying} className={`px-3 border-2 border-black font-bold transition-colors ${isPlaying ? 'bg-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-black'}`} title="Test Voice">
                        <i className={`fa-solid ${isPlaying ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-white dark:bg-neutral-800 inline-block px-1 border border-black">Avatar URL</label>
                <input type="text" value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} className="w-full border-2 border-black p-2 text-sm font-mono outline-none focus:shadow-neo transition-shadow bg-white dark:bg-neutral-800 text-black dark:text-white" placeholder="https://..." />
            </div>

            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-white dark:bg-neutral-800 inline-block px-1 border border-black">Expertise</label>
                <textarea value={formData.expertise} onChange={e => setFormData({...formData, expertise: e.target.value})} className="w-full border-2 border-black p-2 text-sm font-medium outline-none focus:shadow-neo transition-shadow h-20 resize-none bg-white dark:bg-neutral-800 text-black dark:text-white" placeholder="Skills..." />
            </div>

            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-white dark:bg-neutral-800 inline-block px-1 border border-black">Backstory</label>
                <textarea value={formData.backstory} onChange={e => setFormData({...formData, backstory: e.target.value})} className="w-full border-2 border-black p-2 text-sm font-medium outline-none focus:shadow-neo transition-shadow h-24 bg-white dark:bg-neutral-800 text-black dark:text-white" placeholder="History & Personality..." />
            </div>

            <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-black text-white inline-block px-1 border border-black">System Prompt (Advanced)</label>
                <textarea value={formData.systemInstruction} onChange={e => setFormData({...formData, systemInstruction: e.target.value})} className="w-full border-2 border-black p-2 text-xs font-mono outline-none focus:shadow-neo transition-shadow h-32 bg-white dark:bg-neutral-800 text-black dark:text-white" placeholder="Instructions..." />
            </div>

            <div className="pt-4 border-t-2 border-black flex justify-end gap-3">
                {initialAgent && onDelete && (
                    isDeleteConfirming ? (
                        <div className="mr-auto flex items-center gap-2 bg-red-100 px-2 border-2 border-black">
                             <span className="text-xs font-black text-red-600 uppercase">Sure?</span>
                             <button type="button" onClick={handleConfirmDelete} className="px-2 py-1 bg-red-600 text-white font-bold text-xs border border-black">YES</button>
                             <button type="button" onClick={() => setIsDeleteConfirming(false)} className="px-2 py-1 bg-white text-black font-bold text-xs border border-black">NO</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setIsDeleteConfirming(true)} className="mr-auto px-3 py-2 bg-red-500 text-white font-black uppercase border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs">Delete</button>
                    )
                )}
                <button type="button" onClick={onClose} className="px-4 py-2 text-black dark:text-white font-bold uppercase hover:underline text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-neo-primary text-white font-black border-2 border-black shadow-neo hover:bg-violet-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm uppercase">{initialAgent ? 'Save' : 'Create'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AgentModal;