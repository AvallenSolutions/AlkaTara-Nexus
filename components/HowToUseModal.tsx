
import React from 'react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-600 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors duration-300">
         {/* Header */}
         <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center sticky top-0 bg-white dark:bg-avallen-800 z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
               <div className="w-10 h-10 bg-avallen-accent rounded-lg flex items-center justify-center">
                 <i className="fa-solid fa-circle-info text-white"></i>
               </div>
               AlkaTara Nexus - User Guide
            </h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors">
               <i className="fa-solid fa-times text-xl"></i>
            </button>
         </div>

         {/* Content */}
         <div className="p-8 space-y-10 text-gray-700 dark:text-slate-300 leading-relaxed">
            
            {/* Section 1: Intro */}
            <section>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-avallen-700 pb-2">Welcome to AlkaTara Nexus</h3>
                <p className="text-lg mb-4">
                    The Nexus allows you to collaborate with a dedicated team of AI agents, each with a specific persona and expertise (CTO, CFO, Legal, etc.). 
                    Unlike standard chatbots, these agents share a persistent <strong>Knowledge Base</strong> and can work together to build your strategy.
                </p>
                <div className="bg-blue-50 dark:bg-avallen-900/50 p-4 rounded-lg border-l-4 border-avallen-accent">
                    <p className="text-sm italic text-gray-600 dark:text-slate-400">"Think of this tool not as a chat app, but as an operating system for your company where the department heads are always available."</p>
                </div>
            </section>

            {/* Section 2: New Features */}
            <section>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-avallen-700 pb-2">New Power Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex gap-4">
                         <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 flex-shrink-0"><i className="fa-solid fa-microchip"></i></div>
                         <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">Model Selection</h4>
                             <p className="text-sm">Choose between <strong>Flash 2.5</strong> (Fast, Efficient) for everyday tasks and <strong>Pro 3.0</strong> (Smartest) for complex reasoning, coding, and deep analysis.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="w-10 h-10 rounded bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center text-pink-500 flex-shrink-0"><i className="fa-solid fa-pen-ruler"></i></div>
                         <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">Canvas Mode</h4>
                             <p className="text-sm">A split-screen editor for long-form content (Strategy Docs, Code, Blogs). Agents can write directly to it, and you can edit it live.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 flex-shrink-0"><i className="fa-solid fa-magnifying-glass-chart"></i></div>
                         <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">Deep Research</h4>
                             <p className="text-sm">Enables the "Thinking" model. Agents will spend more time reasoning and verifying facts via Google Search before answering complex queries.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 flex-shrink-0"><i className="fa-solid fa-fire"></i></div>
                         <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">Devil's Advocate</h4>
                             <p className="text-sm">Forces agents to critically challenge your assumptions and look for flaws/risks in your plan.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="w-10 h-10 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-500 flex-shrink-0"><i className="fa-solid fa-clipboard-list"></i></div>
                         <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">Directives</h4>
                             <p className="text-sm">Set global rules (e.g., "Always be concise") that apply to all agents in every chat. Manage these via the Sidebar.</p>
                         </div>
                     </div>
                </div>
            </section>

            {/* Section 3: Core Workflows */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-avallen-900/30 p-6 rounded-xl border border-gray-200 dark:border-avallen-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-avallen-accent"></i> Tasks & Kanban
                    </h3>
                    <ul className="text-sm space-y-2">
                        <li><i className="fa-solid fa-check mr-2 text-avallen-accent"></i> Switch to <strong>"Tasks"</strong> view in the sidebar.</li>
                        <li><i className="fa-solid fa-check mr-2 text-avallen-accent"></i> Ask agents to "Create a task to..." with a due date.</li>
                        <li><i className="fa-solid fa-check mr-2 text-avallen-accent"></i> Drag and drop cards to update status.</li>
                    </ul>
                </div>
                <div className="bg-gray-50 dark:bg-avallen-900/30 p-6 rounded-xl border border-gray-200 dark:border-avallen-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-database text-yellow-500"></i> Knowledge Base
                    </h3>
                    <ul className="text-sm space-y-2">
                        <li><i className="fa-solid fa-check mr-2 text-avallen-accent"></i> Upload PDFs, Images, or Notes.</li>
                        <li><i className="fa-solid fa-check mr-2 text-avallen-accent"></i> Organize items into Folders.</li>
                        <li><i className="fa-solid fa-check mr-2 text-avallen-accent"></i> Agents automatically reference this data in chat.</li>
                    </ul>
                </div>
            </section>
            
            {/* Section 4: Tips */}
             <section>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-avallen-700 pb-2">Pro Tips</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                     <li className="flex items-center gap-3 bg-white dark:bg-avallen-700/20 p-3 rounded border border-gray-200 dark:border-avallen-700">
                         <span className="font-mono bg-gray-200 dark:bg-black px-2 py-1 rounded text-xs">@Name</span>
                         <span>Mention a specific agent in a group chat to force a reply.</span>
                     </li>
                     <li className="flex items-center gap-3 bg-white dark:bg-avallen-700/20 p-3 rounded border border-gray-200 dark:border-avallen-700">
                         <span className="font-mono bg-gray-200 dark:bg-black px-2 py-1 rounded text-xs">/clear</span>
                         <span>Start a fresh conversation context immediately.</span>
                     </li>
                     <li className="flex items-center gap-3 bg-white dark:bg-avallen-700/20 p-3 rounded border border-gray-200 dark:border-avallen-700">
                         <span className="font-mono bg-gray-200 dark:bg-black px-2 py-1 rounded text-xs">Auto-Pilot</span>
                         <span>Use "Board Meeting" mode to let agents discuss amongst themselves.</span>
                     </li>
                </ul>
            </section>

         </div>
      </div>
    </div>
  );
};

export default HowToUseModal;
