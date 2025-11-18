
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

      // Calculate "Agent Utilization" based on task assignment (Mock proxy for chat utilization)
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-50 dark:bg-avallen-900 border border-gray-200 dark:border-avallen-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors duration-300">
         
         <div className="p-6 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center sticky top-0 bg-gray-50 dark:bg-avallen-900 z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
               <i className="fa-solid fa-chart-pie text-avallen-accent"></i>
               AlkaTara Analytics
            </h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors">
               <i className="fa-solid fa-times text-xl"></i>
            </button>
         </div>

         <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI Cards */}
            <div className="bg-white dark:bg-avallen-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-avallen-700">
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Task Completion</h3>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-green-500">{stats.completionRate}%</span>
                    <span className="text-sm text-gray-500 dark:text-slate-400 mb-1">({stats.completedTasks}/{stats.totalTasks})</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-avallen-900/50 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                </div>
            </div>

            <div className="bg-white dark:bg-avallen-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-avallen-700">
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Total Sessions</h3>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-avallen-accent">{stats.totalSessions}</span>
                </div>
                <div className="mt-4 flex gap-4 text-xs text-gray-500 dark:text-slate-400">
                    <span><i className="fa-solid fa-users mr-1"></i> {stats.focusGroups} Focus Groups</span>
                    <span><i className="fa-solid fa-building mr-1"></i> {stats.boardMeetings} Board Mtgs</span>
                </div>
            </div>

             <div className="bg-white dark:bg-avallen-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-avallen-700">
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Most Active Agent</h3>
                <div className="flex items-center gap-3 mt-2">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-avallen-900 flex items-center justify-center overflow-hidden border-2 border-avallen-accent">
                         <img 
                            src={agents.find(a => a.name === stats.topAgentName)?.avatarUrl} 
                            alt={stats.topAgentName}
                            className="w-full h-full object-cover"
                         />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white block">{stats.topAgentName}</span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">Top Assignee</span>
                    </div>
                </div>
            </div>

            {/* Detailed Charts Area */}
            <div className="md:col-span-3 bg-white dark:bg-avallen-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-avallen-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Agent Workload Distribution</h3>
                <div className="flex items-end justify-around h-40 gap-4">
                    {agents.map(agent => {
                        const count = stats.agentTaskCounts[agent.name] || 0;
                        const max = Math.max(...Object.values(stats.agentTaskCounts), 1);
                        const height = Math.max((count / max) * 100, 5); // Min 5% height
                        
                        return (
                            <div key={agent.id} className="flex flex-col items-center w-full group">
                                <div className="relative w-full max-w-[40px] bg-gray-100 dark:bg-avallen-900 rounded-t-lg overflow-hidden" style={{ height: `${height}%` }}>
                                    <div className={`absolute inset-0 ${agent.avatarColor} opacity-60 group-hover:opacity-80 transition-opacity`}></div>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                                </div>
                                <div className="mt-2 w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-avallen-600">
                                    {agent.avatarUrl && <img src={agent.avatarUrl} className="w-full h-full object-cover" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 truncate w-full text-center">{agent.name}</span>
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