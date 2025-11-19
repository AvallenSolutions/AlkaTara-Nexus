import React, { useMemo } from 'react';
import { Task, TaskStatus, Agent, ChatSession } from '../types';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  sessions: ChatSession[];
  agents: Agent[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose, tasks, sessions, agents }) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const totalSessions = sessions.length;
      const focusGroups = sessions.filter(s => s.mode === 'FOCUS_GROUP').length;
      const boardMeetings = sessions.filter(s => s.mode === 'WHOLE_SUITE').length;

      const agentTaskCounts: Record<string, number> = {};
      agents.forEach(a => agentTaskCounts[a.name] = 0);
      tasks.forEach(t => {
          if (t.assignee && agentTaskCounts[t.assignee] !== undefined) {
              agentTaskCounts[t.assignee]++;
          }
      });
      const topAgentName = Object.keys(agentTaskCounts).reduce((a, b) => agentTaskCounts[a] > agentTaskCounts[b] ? a : b, agents[0]?.name);

      return { totalTasks, completedTasks, completionRate, totalSessions, focusGroups, boardMeetings, topAgentName, agentTaskCounts };
  }, [tasks, sessions, agents]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neo-bg dark:bg-neutral-900 border-3 border-black w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-neo-xl flex flex-col bg-pattern">
         
         <div className="p-6 border-b-3 border-black flex justify-between items-center bg-white dark:bg-neutral-800 sticky top-0 z-10">
            <h2 className="text-2xl font-black text-black dark:text-white flex items-center gap-3 uppercase tracking-tighter">
               <div className="w-12 h-12 bg-purple-500 border-2 border-black flex items-center justify-center shadow-neo-sm">
                    <i className="fa-solid fa-chart-pie text-white"></i>
               </div>
               Nexus Analytics
            </h2>
            <button onClick={onClose} className="w-10 h-10 bg-white border-2 border-black hover:bg-red-500 hover:text-white shadow-neo-sm flex items-center justify-center text-black transition-colors">
               <i className="fa-solid fa-times text-xl"></i>
            </button>
         </div>

         <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI Cards */}
            <div className="bg-white dark:bg-neutral-800 p-6 border-3 border-black shadow-neo hover:-translate-y-1 transition-transform">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-4 bg-green-300 inline-block px-1 border border-black">Task Completion</h3>
                <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-black dark:text-white">{stats.completionRate}%</span>
                    <span className="text-sm font-bold text-gray-500 mb-2">({stats.completedTasks}/{stats.totalTasks})</span>
                </div>
                <div className="w-full bg-gray-200 h-4 border-2 border-black mt-4">
                    <div className="bg-green-500 h-full border-r-2 border-black" style={{ width: `${stats.completionRate}%` }}></div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-6 border-3 border-black shadow-neo hover:-translate-y-1 transition-transform">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-4 bg-yellow-300 inline-block px-1 border border-black">Total Sessions</h3>
                <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-black dark:text-white">{stats.totalSessions}</span>
                </div>
                <div className="mt-4 flex gap-4 text-xs font-bold text-black dark:text-white">
                    <span className="bg-gray-100 px-2 py-1 border border-black"><i className="fa-solid fa-users mr-1"></i> {stats.focusGroups} Focus</span>
                    <span className="bg-gray-100 px-2 py-1 border border-black"><i className="fa-solid fa-building mr-1"></i> {stats.boardMeetings} Board</span>
                </div>
            </div>

             <div className="bg-white dark:bg-neutral-800 p-6 border-3 border-black shadow-neo hover:-translate-y-1 transition-transform">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-4 bg-pink-300 inline-block px-1 border border-black">MVP Agent</h3>
                <div className="flex items-center gap-4 mt-2">
                    <div className="w-16 h-16 bg-gray-200 border-2 border-black overflow-hidden shadow-sm">
                         <img 
                            src={agents.find(a => a.name === stats.topAgentName)?.avatarUrl} 
                            alt={stats.topAgentName}
                            className="w-full h-full object-cover"
                         />
                    </div>
                    <div>
                        <span className="text-xl font-black text-black dark:text-white block uppercase">{stats.topAgentName}</span>
                        <span className="text-xs font-bold bg-black text-white px-2 py-1">TOP ASSIGNEE</span>
                    </div>
                </div>
            </div>

            {/* Detailed Charts Area */}
            <div className="md:col-span-3 bg-white dark:bg-neutral-800 p-6 border-3 border-black shadow-neo">
                <h3 className="text-sm font-black text-black dark:text-white uppercase mb-6 border-b-2 border-black pb-2">Agent Workload Distribution</h3>
                <div className="flex items-end justify-around h-48 gap-4">
                    {agents.map((agent, i) => {
                        const count = stats.agentTaskCounts[agent.name] || 0;
                        const max = Math.max(...(Object.values(stats.agentTaskCounts) as number[]), 1);
                        const height = Math.max((count / max) * 100, 5);
                        // Rotate colors
                        const colors = ['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'];
                        const barColor = colors[i % colors.length];
                        
                        return (
                            <div key={agent.id} className="flex flex-col items-center w-full group relative">
                                <div className="w-full max-w-[60px] relative h-full flex items-end">
                                    <div 
                                        className={`w-full ${barColor} border-2 border-black transition-all group-hover:bg-black group-hover:text-white relative`} 
                                        style={{ height: `${height}%` }}
                                    >
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-sm bg-white border-2 border-black px-1 opacity-0 group-hover:opacity-100 transition-opacity text-black">{count}</span>
                                    </div>
                                </div>
                                <div className="mt-3 w-8 h-8 border-2 border-black overflow-hidden">
                                    {agent.avatarUrl && <img src={agent.avatarUrl} className="w-full h-full object-cover" />}
                                </div>
                                <span className="text-[10px] font-bold text-black dark:text-white mt-1 truncate w-full text-center uppercase">{agent.name}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;