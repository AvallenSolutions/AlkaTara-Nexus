
import React, { useState } from 'react';
import { Task, TaskStatus, Agent } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  agents: Agent[]; // To assign tasks to agents
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void; 
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, agents, onUpdateTask, onDeleteTask, onAddTask }) => {
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
      title: '',
      description: '',
      assignee: 'User',
      priority: 'MEDIUM' as 'LOW'|'MEDIUM'|'HIGH',
      dueDate: '' // YYYY-MM-DDTHH:mm
  });

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
        onUpdateTask({ ...task, status });
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmitTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.title) return;
      
      const timestamp = newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined;
      
      const taskPayload: any = {
          id: Math.random().toString(36).substr(2, 9),
          title: newTask.title,
          description: newTask.description,
          status: TaskStatus.TODO,
          priority: newTask.priority,
          assignee: newTask.assignee,
          dueDate: timestamp,
          createdAt: Date.now()
      };
      
      onUpdateTask(taskPayload);
      setIsAdding(false);
      setNewTask({ title: '', description: '', assignee: 'User', priority: 'MEDIUM', dueDate: '' });
  };

  const getPriorityColor = (p: string) => {
      if (p === 'HIGH') return 'bg-red-500';
      if (p === 'MEDIUM') return 'bg-yellow-500';
      return 'bg-blue-500';
  };

  const getAssigneeAvatar = (name: string) => {
      if (name === 'User') return null;
      const agent = agents.find(a => a.name === name);
      return agent ? agent.avatarUrl : null;
  };

  const formatDate = (ts?: number) => {
      if (!ts) return '';
      const date = new Date(ts);
      const now = new Date();
      const isOverdue = date.getTime() < now.getTime();
      return (
        <span className={`${isOverdue ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-slate-400'}`}>
           <i className="fa-regular fa-clock mr-1"></i>
           {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           {isOverdue && ' (Overdue)'}
        </span>
      );
  };

  const Column = ({ title, status, icon }: { title: string, status: TaskStatus, icon: string }) => (
    <div 
        className="flex-1 bg-gray-100 dark:bg-avallen-800/50 rounded-xl flex flex-col border border-gray-200 dark:border-avallen-700 min-h-[500px] transition-colors duration-300"
        onDrop={(e) => handleDrop(e, status)}
        onDragOver={handleDragOver}
    >
        <div className="p-4 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i className={`${icon} text-avallen-accent`}></i> {title}
            </h3>
            <span className="bg-gray-200 dark:bg-avallen-700 text-xs px-2 py-1 rounded-full text-gray-600 dark:text-slate-300">
                {getTasksByStatus(status).length}
            </span>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {getTasksByStatus(status).map(task => (
                <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white dark:bg-avallen-700 border border-gray-200 dark:border-avallen-600 p-3 rounded-lg shadow-sm cursor-move hover:border-avallen-500 transition-colors group relative"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        <button 
                            onClick={() => onDeleteTask(task.id)}
                            className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{task.title}</h4>
                    {task.description && <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2 mb-2">{task.description}</p>}
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-avallen-600/50 text-[10px] text-gray-500 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                             {getAssigneeAvatar(task.assignee || 'User') ? (
                                 <img src={getAssigneeAvatar(task.assignee || 'User')} className="w-5 h-5 rounded-full border border-gray-300 dark:border-avallen-500" alt="assignee" />
                             ) : (
                                 <i className="fa-solid fa-user-circle text-lg text-gray-400 dark:text-slate-400"></i>
                             )}
                             <span>{task.assignee || 'User'}</span>
                        </div>
                    </div>
                    {task.dueDate && (
                        <div className="mt-2 text-[10px]">
                            {formatDate(task.dueDate)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-avallen-900 flex flex-col transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Action Plan</h2>
             <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-avallen-accent hover:bg-sky-400 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition-colors"
             >
                <i className={`fa-solid ${isAdding ? 'fa-minus' : 'fa-plus'}`}></i> New Task
             </button>
        </div>

        {/* Add Task Form */}
        {isAdding && (
            <div className="mb-8 bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-700 p-4 rounded-xl animate-fade-in shadow-xl">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 uppercase">Create New Task</h3>
                <form onSubmit={handleSubmitTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <input 
                            type="text" 
                            placeholder="Task Title" 
                            className="w-full bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white text-sm focus:border-avallen-accent outline-none"
                            value={newTask.title}
                            onChange={e => setNewTask({...newTask, title: e.target.value})}
                            required
                        />
                    </div>
                    <div className="col-span-2">
                        <textarea 
                            placeholder="Description (Optional)" 
                            className="w-full bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white text-sm focus:border-avallen-accent outline-none h-20 resize-none"
                            value={newTask.description}
                            onChange={e => setNewTask({...newTask, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-slate-400 font-bold block mb-1">Assign To</label>
                        <select 
                            className="w-full bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white text-sm outline-none"
                            value={newTask.assignee}
                            onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                        >
                            <option value="User">User (Me)</option>
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.name}>{agent.name} ({agent.role})</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="text-xs text-gray-500 dark:text-slate-400 font-bold block mb-1">Due Date</label>
                        <input 
                            type="datetime-local" 
                            className="w-full bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white text-sm outline-none" // Standard calendar picker
                            value={newTask.dueDate}
                            onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                        />
                    </div>
                     <div>
                        <label className="text-xs text-gray-500 dark:text-slate-400 font-bold block mb-1">Priority</label>
                        <select 
                            className="w-full bg-gray-50 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white text-sm outline-none"
                            value={newTask.priority}
                            onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                         <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm transition-colors">
                             Save Task
                         </button>
                    </div>
                </form>
            </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
            <Column title="To Do" status={TaskStatus.TODO} icon="fa-regular fa-circle" />
            <Column title="In Progress" status={TaskStatus.IN_PROGRESS} icon="fa-solid fa-spinner" />
            <Column title="Done" status={TaskStatus.DONE} icon="fa-solid fa-check-circle" />
        </div>
    </div>
  );
};

export default KanbanBoard;