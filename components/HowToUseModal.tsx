import React, { useState } from 'react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'BASICS' | 'POWER_TOOLS' | 'WORKFLOW' | 'ANALYTICS';

const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('BASICS');

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: string }[] = [
      { id: 'BASICS', label: 'Start', icon: 'fa-rocket' },
      { id: 'POWER_TOOLS', label: 'Tools', icon: 'fa-microchip' },
      { id: 'WORKFLOW', label: 'Work', icon: 'fa-list-check' },
      { id: 'ANALYTICS', label: 'Data', icon: 'fa-sliders' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 border-3 border-black w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-neo-xl flex flex-col">
         
         {/* Header */}
         <div className="p-6 border-b-3 border-black flex justify-between items-center bg-neo-paper dark:bg-neutral-800">
            <h2 className="text-2xl font-black text-black dark:text-white flex items-center gap-3 uppercase tracking-tighter">
               <div className="w-12 h-12 bg-neo-primary border-2 border-black flex items-center justify-center shadow-neo-sm">
                 <i className="fa-solid fa-book-open text-white"></i>
               </div>
               Nexus Manual
            </h2>
            <button onClick={onClose} className="w-10 h-10 bg-white border-2 border-black hover:bg-red-500 hover:text-white shadow-neo-sm flex items-center justify-center text-black transition-colors">
               <i className="fa-solid fa-times text-xl"></i>
            </button>
         </div>

         {/* Tabs */}
         <div className="flex border-b-3 border-black bg-gray-100 dark:bg-neutral-900 overflow-x-auto p-2 gap-2">
             {tabs.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-black uppercase border-2 transition-all shadow-sm ${activeTab === tab.id ? 'bg-black text-white border-black shadow-neo-sm' : 'bg-white text-gray-500 border-black hover:bg-yellow-100'}`}
                 >
                     <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
                 </button>
             ))}
         </div>

         {/* Content Area */}
         <div className="p-8 overflow-y-auto flex-1 text-black dark:text-white leading-relaxed bg-pattern bg-white dark:bg-neutral-900">
            
            {/* TAB 1: BASICS */}
            {activeTab === 'BASICS' && (
                <div className="space-y-8">
                    <section className="bg-white dark:bg-neutral-800 p-6 border-2 border-black shadow-neo">
                        <h3 className="text-xl font-black uppercase mb-4 bg-yellow-300 inline-block px-1 border border-black text-black">The Concept</h3>
                        <p className="mb-4 font-medium">
                            AlkaTara Nexus is an <strong>Agentic Operating System</strong>. 
                            You are the CEO. You have a permanent C-Suite of 7 specialist AI agents ready to work 24/7.
                        </p>
                        <div className="bg-blue-100 p-4 border-2 border-black flex items-start gap-3">
                            <i className="fa-solid fa-quote-left text-3xl text-blue-500"></i>
                            <p className="text-sm font-bold italic text-black">"Treat them like real senior employees. Give them context, ask for their specific expertise, and let them debate strategy."</p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-neutral-800 p-5 border-2 border-black shadow-neo-sm">
                            <h4 className="font-black uppercase mb-2 flex items-center gap-2"><i className="fa-solid fa-comments text-neo-primary"></i> Chat Modes</h4>
                            <ul className="space-y-2 text-sm font-bold">
                                <li className="bg-gray-100 p-2 border border-black">1. Individual: One-on-one deep dive.</li>
                                <li className="bg-gray-100 p-2 border border-black">2. Focus Group: Select 2-3 agents for cross-functional tasks.</li>
                                <li className="bg-gray-100 p-2 border border-black">3. Whole Suite: Full board meeting.</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 p-5 border-2 border-black shadow-neo-sm">
                            <h4 className="font-black uppercase mb-2 flex items-center gap-2"><i className="fa-solid fa-database text-yellow-500"></i> Knowledge Base</h4>
                            <p className="text-sm mb-2 font-medium">The "Long Term Memory".</p>
                            <div className="flex gap-2 flex-wrap">
                                <span className="bg-green-200 text-black px-2 py-1 text-xs font-black border border-black">UPLOAD</span>
                                <span className="bg-green-200 text-black px-2 py-1 text-xs font-black border border-black">AI IMPORT</span>
                                <span className="bg-green-200 text-black px-2 py-1 text-xs font-black border border-black">RECALL</span>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 2: POWER TOOLS */}
            {activeTab === 'POWER_TOOLS' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {[
                             { title: 'Canvas Mode', icon: 'fa-pen-ruler', color: 'bg-pink-500', desc: 'Split-screen editor for long-form content. Agents write directly to the Canvas.' },
                             { title: 'Deep Research', icon: 'fa-magnifying-glass-chart', color: 'bg-blue-500', desc: 'Activates the "Thinking" model. Agents verify facts via Google Search.' },
                             { title: 'Devil\'s Advocate', icon: 'fa-fire', color: 'bg-red-500', desc: 'Agents become highly critical. They challenge assumptions and find flaws.' },
                             { title: 'Directives', icon: 'fa-gavel', color: 'bg-green-500', desc: 'Set global "Laws" that all agents must follow.' }
                         ].map(tool => (
                            <div key={tool.title} className="flex gap-4 p-4 bg-white dark:bg-neutral-800 border-2 border-black shadow-neo-sm hover:shadow-neo transition-shadow">
                                <div className={`w-12 h-12 ${tool.color} border-2 border-black flex items-center justify-center text-white text-xl flex-shrink-0 shadow-sm`}>
                                    <i className={`fa-solid ${tool.icon}`}></i>
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-lg">{tool.title}</h4>
                                    <p className="text-sm font-medium mt-1">{tool.desc}</p>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            )}

            {/* TAB 3: WORKFLOW */}
            {activeTab === 'WORKFLOW' && (
                <div className="space-y-8">
                    <section>
                        <h3 className="text-xl font-black uppercase mb-4 bg-blue-300 inline-block px-1 border border-black text-black">Actionable Outputs</h3>
                        <div className="grid gap-4">
                            {[
                                { title: 'Email Drafts', icon: 'fa-envelope', color: 'text-blue-500', desc: 'Generates a card with "Open in Mail" button.' },
                                { title: 'Calendar Invites', icon: 'fa-calendar-check', color: 'text-orange-500', desc: 'Generates a card with "Add to Calendar" link.' },
                                { title: 'Export Chat', icon: 'fa-file-export', color: 'text-gray-500', desc: 'Download full transcript as Markdown.' }
                            ].map(item => (
                                <div key={item.title} className="border-2 border-black bg-white p-4 shadow-neo-sm flex items-center gap-4">
                                    <i className={`fa-solid ${item.icon} text-2xl ${item.color}`}></i>
                                    <div>
                                        <h4 className="font-black uppercase text-black">{item.title}</h4>
                                        <p className="text-sm font-medium text-black">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-neutral-800 p-6 border-2 border-black shadow-neo">
                        <h3 className="text-xl font-black uppercase mb-4 text-black dark:text-white">Task Management (Kanban)</h3>
                        <div className="flex gap-4 mb-4">
                            <div className="bg-pink-200 px-3 py-1 border border-black font-bold text-xs text-black">TODO</div>
                            <div className="bg-blue-200 px-3 py-1 border border-black font-bold text-xs text-black">IN PROGRESS</div>
                            <div className="bg-green-200 px-3 py-1 border border-black font-bold text-xs text-black">DONE</div>
                        </div>
                        <p className="text-sm font-medium">
                            Switch to the <strong>Tasks</strong> view. Drag and drop cards. Assign agents or yourself.
                        </p>
                    </section>
                </div>
            )}

            {/* TAB 4: ANALYTICS */}
            {activeTab === 'ANALYTICS' && (
                <div className="space-y-8">
                     <section className="bg-white dark:bg-neutral-800 p-6 border-2 border-black shadow-neo">
                        <h3 className="text-xl font-black uppercase mb-4">Dashboard</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <i className="fa-solid fa-chart-pie text-4xl text-purple-500"></i>
                            <p className="text-sm font-bold">
                                Track completion rates and agent utilization.
                            </p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-neutral-800 p-5 border-2 border-black shadow-neo-sm">
                            <h4 className="font-black uppercase mb-2">Voice Customization</h4>
                            <p className="text-sm font-medium mb-2">Assign specific premium AI voices to each agent.</p>
                            <div className="bg-gray-100 p-2 border border-black text-xs font-mono text-black">
                                Edit Agent {'>'} Select Voice (e.g. "Puck")
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 p-5 border-2 border-black shadow-neo-sm">
                            <h4 className="font-black uppercase mb-2">Feedback (RLHF)</h4>
                            <div className="flex gap-2">
                                <button className="bg-white border border-black p-1 text-black"><i className="fa-solid fa-thumbs-up text-green-500"></i></button>
                                <button className="bg-white border border-black p-1 text-black"><i className="fa-solid fa-thumbs-down text-red-500"></i></button>
                            </div>
                            <p className="text-sm font-medium mt-2">Fine-tune the system by rating responses.</p>
                        </div>
                    </section>
                </div>
            )}

         </div>
      </div>
    </div>
  );
};

export default HowToUseModal;