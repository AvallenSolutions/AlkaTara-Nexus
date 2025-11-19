import React, { useState } from 'react';
import { Task, TaskStatus, Agent } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  agents: Agent[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void; 
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, agents, onUpdateTask, onDeleteTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: 'User', priority: 'MEDIUM' as any, dueDate: '' });

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);
  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) onUpdateTask({ ...task, status });
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmitTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.title) return;
      const timestamp = newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined;
      onUpdateTask({ id: Math.random().toString(36).substr(2, 9), title: newTask.title, description: newTask.description, status: TaskStatus.TODO, priority: newTask.priority, assignee: newTask.assignee, dueDate: timestamp, createdAt: Date.now() });
      setIsAdding(false); setNewTask({ title: '', description: '', assignee: 'User', priority: 'MEDIUM', dueDate: '' });
  };

  const getPriorityColor = (p: string) => {
      if (p === 'HIGH') return 'bg-red-500 border-black';
      if (p === 'MEDIUM') return 'bg-yellow-400 border-black';
      return 'bg-blue-400 border-black';
  };

  const formatDate = (ts?: number) => {
      if (!ts) return '';
      const date = new Date(ts);
      const isOverdue = date.getTime() < new Date().getTime();
      return <span className={`text-[10px] font-bold border border-black px-1 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>{date.toLocaleDateString()}</span>;
  };

  const Column = ({ title, status, color }: { title: string, status: TaskStatus, color: string }) => (
    <div className={`flex-1 ${color} border-3 border-black flex flex-col min-h-[500px] shadow-neo p-2`} onDrop={(e) => handleDrop(e, status)} onDragOver={handleDragOver}>
        <div className="p-2 border-b-3 border-black mb-4 flex justify-between bg-white">
            <h3 className="font-black uppercase text-black">{title}</h3>
            <span className="bg-black text-white text-xs font-bold px-2 py-0.5">{getTasksByStatus(status).length}</span>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto">
            {getTasksByStatus(status).map(task => (
                <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="bg-white dark:bg-neutral-800 border-2 border-black p-3 shadow-neo-sm cursor-move hover:translate-x-1 hover:-translate-y-1 hover:shadow-neo transition-all group relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className={`w-3 h-3 border-2 ${getPriorityColor(task.priority)}`}></div>
                        <button onClick={() => onDeleteTask(task.id)} className="text-black hover:text-red-600 opacity-0 group-hover:opacity-100 font-bold text-xs">X</button>
                    </div>
                    <h4 className="text-sm font-bold text-black dark:text-white mb-1 leading-tight">{task.title}</h4>
                    {task.description && <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 font-mono bg-gray-100 dark:bg-black p-1 border border-gray-300 dark:border-gray-700 mb-2">{task.description}</p>}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-bold bg-black text-white px-1">{task.assignee || 'User'}</span>
                        {task.dueDate && formatDate(task.dueDate)}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-pattern bg-neo-bg dark:bg-neutral-900">
        <div className="flex justify-between items-center mb-8">
             <h2 className="text-4xl font-black text-black dark:text-white uppercase italic tracking-tighter">Task Board</h2>
             <button onClick={() => setIsAdding(!isAdding)} className="bg-neo-primary text-white border-3 border-black px-4 py-2 font-black uppercase shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                {isAdding ? 'Close' : 'Add Task'}
             </button>
        </div>

        {isAdding && (
            <div className="mb-8 bg-white dark:bg-neutral-800 border-3 border-black p-4 shadow-neo-lg relative z-10">
                <h3 className="text-lg font-black uppercase mb-4 bg-yellow-300 inline-block px-2 border-2 border-black">New Task</h3>
                <form onSubmit={handleSubmitTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="TASK TITLE" className="col-span-2 w-full border-2 border-black p-2 font-bold outline-none focus:bg-yellow-50" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                    <textarea placeholder="DETAILS..." className="col-span-2 w-full border-2 border-black p-2 font-mono text-sm outline-none focus:bg-yellow-50 h-20" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                    <select className="border-2 border-black p-2 font-bold" value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})}>
                        <option value="User">User</option>{agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                    <select className="border-2 border-black p-2 font-bold" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}>
                        <option value="LOW">Low Priority</option><option value="MEDIUM">Medium Priority</option><option value="HIGH">High Priority</option>
                    </select>
                    <input type="datetime-local" className="border-2 border-black p-2 font-bold" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                    <button type="submit" className="w-full bg-green-500 text-white font-black border-2 border-black uppercase hover:bg-green-600 transition-colors">Save Task</button>
                </form>
            </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
            <Column title="To Do" status={TaskStatus.TODO} color="bg-pink-100 dark:bg-pink-900/20" />
            <Column title="In Progress" status={TaskStatus.IN_PROGRESS} color="bg-blue-100 dark:bg-blue-900/20" />
            <Column title="Done" status={TaskStatus.DONE} color="bg-green-100 dark:bg-green-900/20" />
        </div>
    </div>
  );
};

export default KanbanBoard;