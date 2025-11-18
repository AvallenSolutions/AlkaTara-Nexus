
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
      { id: 'BASICS', label: 'Getting Started', icon: 'fa-rocket' },
      { id: 'POWER_TOOLS', label: 'Power Tools', icon: 'fa-microchip' },
      { id: 'WORKFLOW', label: 'Workflow & Actions', icon: 'fa-list-check' },
      { id: 'ANALYTICS', label: 'Analytics & Settings', icon: 'fa-sliders' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-600 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col transition-colors duration-300">
         
         {/* Header */}
         <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center bg-white dark:bg-avallen-800 z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
               <div className="w-10 h-10 bg-avallen-accent rounded-lg flex items-center justify-center shadow-lg shadow-avallen-accent/20">
                 <i className="fa-solid fa-book-open text-white"></i>
               </div>
               AlkaTara Nexus Manual
            </h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors">
               <i className="fa-solid fa-times text-xl"></i>
            </button>
         </div>

         {/* Tabs */}
         <div className="flex border-b border-gray-200 dark:border-avallen-700 bg-gray-50 dark:bg-avallen-900/50 overflow-x-auto">
             {tabs.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-avallen-accent text-avallen-accent bg-white dark:bg-avallen-800' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                 >
                     <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
                 </button>
             ))}
         </div>

         {/* Content Area */}
         <div className="p-8 overflow-y-auto flex-1 text-gray-700 dark:text-slate-300 leading-relaxed">
            
            {/* TAB 1: BASICS */}
            {activeTab === 'BASICS' && (
                <div className="space-y-8 animate-fade-in">
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">The Concept</h3>
                        <p className="mb-4">
                            AlkaTara Nexus is not a standard chatbot. It is an <strong>Agentic Operating System</strong>. 
                            You are the CEO, and you have a permanent C-Suite of 7 specialist AI agents (CTO, CFO, CMO, etc.) ready to work for you 24/7.
                        </p>
                        <div className="bg-blue-50 dark:bg-avallen-900/50 p-4 rounded-lg border-l-4 border-avallen-accent">
                            <p className="text-sm italic">"Treat them like real senior employees. Give them context, ask for their specific expertise, and let them debate strategy."</p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 dark:bg-avallen-700/20 p-5 rounded-xl border border-gray-200 dark:border-avallen-700">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><i className="fa-solid fa-comments text-avallen-accent"></i> Chat Modes</h4>
                            <ul className="space-y-2 text-sm">
                                <li><strong>Individual:</strong> One-on-one deep dive with a single specialist.</li>
                                <li><strong>Focus Group:</strong> Select 2-3 specific agents (e.g., "CTO + Legal") to solve a cross-functional problem.</li>
                                <li><strong>Whole Suite:</strong> A full board meeting. Agents reply sequentially, building on each other's points.</li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 dark:bg-avallen-700/20 p-5 rounded-xl border border-gray-200 dark:border-avallen-700">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><i className="fa-solid fa-database text-yellow-500"></i> Knowledge Base</h4>
                            <p className="text-sm mb-2">The "Long Term Memory" of your company.</p>
                            <ul className="space-y-2 text-sm">
                                <li><i className="fa-solid fa-check text-green-500 mr-1"></i> <strong>Upload:</strong> PDFs, Word docs, or Images (e.g., Competitor Pricing).</li>
                                <li><i className="fa-solid fa-check text-green-500 mr-1"></i> <strong>AI Import:</strong> Paste raw notes and let the AI format them automatically.</li>
                                <li><i className="fa-solid fa-check text-green-500 mr-1"></i> <strong>Recall:</strong> Agents automatically search this before answering you.</li>
                            </ul>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 2: POWER TOOLS */}
            {activeTab === 'POWER_TOOLS' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-avallen-700/30 border border-gray-200 dark:border-avallen-700">
                             <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center text-pink-500 text-xl flex-shrink-0"><i className="fa-solid fa-pen-ruler"></i></div>
                             <div>
                                 <h4 className="font-bold text-gray-900 dark:text-white text-lg">Canvas Mode</h4>
                                 <p className="text-sm mt-1">A split-screen editor for long-form content (Strategy Docs, Code, Blogs). Agents won't clutter the chat; they write directly to the Canvas.</p>
                                 <p className="text-xs text-gray-500 mt-2 font-mono bg-white dark:bg-black/20 p-1 rounded inline-block">"Write a blog post about sustainability to the Canvas"</p>
                             </div>
                         </div>

                         <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-avallen-700/30 border border-gray-200 dark:border-avallen-700">
                             <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 text-xl flex-shrink-0"><i className="fa-solid fa-magnifying-glass-chart"></i></div>
                             <div>
                                 <h4 className="font-bold text-gray-900 dark:text-white text-lg">Deep Research</h4>
                                 <p className="text-sm mt-1">Activates the "Thinking" model. Agents spend significantly more time reasoning and verifying facts via Google Search before answering. Ideal for complex market analysis.</p>
                             </div>
                         </div>

                         <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-avallen-700/30 border border-gray-200 dark:border-avallen-700">
                             <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-xl flex-shrink-0"><i className="fa-solid fa-fire"></i></div>
                             <div>
                                 <h4 className="font-bold text-gray-900 dark:text-white text-lg">Devil's Advocate</h4>
                                 <p className="text-sm mt-1">Toggles the agents' behavior to be highly critical. They will challenge your assumptions, look for legal risks, and find flaws in your plan. Essential for stress-testing ideas.</p>
                             </div>
                         </div>

                         <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-avallen-700/30 border border-gray-200 dark:border-avallen-700">
                             <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-500 text-xl flex-shrink-0"><i className="fa-solid fa-clipboard-list"></i></div>
                             <div>
                                 <h4 className="font-bold text-gray-900 dark:text-white text-lg">Directives</h4>
                                 <p className="text-sm mt-1">Set global "Laws" that all agents must follow (e.g., "Always suggest a low-cost alternative"). Manage these via the sidebar tab.</p>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            {/* TAB 3: WORKFLOW */}
            {activeTab === 'WORKFLOW' && (
                <div className="space-y-8 animate-fade-in">
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Actionable Outputs</h3>
                        <p className="mb-4">Agents can do more than just talk. They can generate structured interactive cards.</p>
                        
                        <div className="space-y-4">
                            <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-4">
                                <div className="text-blue-500 text-2xl"><i className="fa-solid fa-envelope"></i></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Email Drafts</h4>
                                    <p className="text-sm">Ask: <em>"Draft an email to investors about our Q3 growth."</em></p>
                                    <p className="text-sm mt-1">The agent creates a card with a button to <strong>Open in your Default Mail Client</strong> instantly.</p>
                                </div>
                            </div>

                            <div className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg flex items-start gap-4">
                                <div className="text-orange-500 text-2xl"><i className="fa-solid fa-calendar-check"></i></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Calendar Invites</h4>
                                    <p className="text-sm">Ask: <em>"Schedule a team sync for next Tuesday at 10 AM."</em></p>
                                    <p className="text-sm mt-1">Generates a card with an <strong>Add to Google Calendar</strong> link pre-filled with details.</p>
                                </div>
                            </div>

                             <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-start gap-4">
                                <div className="text-gray-500 text-2xl"><i className="fa-solid fa-file-export"></i></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Export Chat</h4>
                                    <p className="text-sm">Click the <i className="fa-solid fa-file-export mx-1"></i> icon in the header to download the full transcript as a Markdown file. Perfect for saving meeting minutes.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Task Management (Kanban)</h3>
                        <p className="text-sm mb-4">
                            Switch to the <strong>Tasks</strong> view in the sidebar. You can ask agents to "Create a task" or add them manually.
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-2">
                            <li><strong>Assignment:</strong> Tasks can be assigned to specific Agents or yourself.</li>
                            <li><strong>Due Dates:</strong> Agents understand time. "Due next Friday" works.</li>
                            <li><strong>Status:</strong> Drag and drop cards between To Do, In Progress, and Done.</li>
                        </ul>
                    </section>
                </div>
            )}

            {/* TAB 4: ANALYTICS */}
            {activeTab === 'ANALYTICS' && (
                <div className="space-y-8 animate-fade-in">
                     <section>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analytics Dashboard</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <i className="fa-solid fa-chart-pie text-4xl text-purple-500"></i>
                            <p className="text-sm">
                                Click the <strong>Analytics</strong> tab in the sidebar to see a visual breakdown of your productivity.
                            </p>
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <li className="bg-gray-50 dark:bg-avallen-900 p-3 rounded border border-gray-200 dark:border-avallen-700">
                                <strong>Task Completion Rate:</strong> Track how fast you are closing items.
                            </li>
                            <li className="bg-gray-50 dark:bg-avallen-900 p-3 rounded border border-gray-200 dark:border-avallen-700">
                                <strong>Agent Utilization:</strong> See which agents (e.g., CFO vs CTO) are doing the most work.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Customization</h3>
                        
                        <div className="mb-6">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Voice Customization</h4>
                            <p className="text-sm mb-2">
                                You can now assign specific TTS (Text-to-Speech) voices to each agent so they sound distinct.
                            </p>
                            <ol className="list-decimal pl-5 text-sm space-y-1 text-gray-600 dark:text-slate-400">
                                <li>Click the <strong>Edit (Pencil)</strong> icon next to an agent in the sidebar.</li>
                                <li>Use the <strong>Voice</strong> dropdown to select a voice from your system (e.g., "Google UK English Female").</li>
                                <li>Save. Now when you click the <i className="fa-solid fa-volume-high mx-1"></i> icon on their message, it uses that voice.</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Feedback Loop (RLHF)</h4>
                            <p className="text-sm">
                                Use the <i className="fa-solid fa-thumbs-up text-green-500 mx-1"></i> and <i className="fa-solid fa-thumbs-down text-red-500 mx-1"></i> buttons on agent messages. 
                                This data is saved and helps fine-tune the system's reliability over time.
                            </p>
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
