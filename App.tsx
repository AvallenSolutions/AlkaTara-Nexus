
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, logOut } from './services/firebase';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import KnowledgeBasePanel from './components/KnowledgeBasePanel';
import AgentModal from './components/AgentModal';
import KanbanBoard from './components/KanbanBoard';
import HowToUseModal from './components/HowToUseModal';
import CanvasPanel from './components/CanvasPanel';
import DirectivesModal from './components/DirectivesModal';
import { generateAgentResponse } from './services/geminiService';
import { INITIAL_AGENTS } from './constants';
import { Agent, Message, ChatMode, Attachment, KnowledgeItem, Task, TaskStatus, Folder, CanvasDocument, ChatSession, Directive } from './types';
import { 
  initializeUserData, listenToAgents, listenToKnowledgeBase, 
  listenToMessages, addMessage, addKnowledgeItem, saveAgent, deleteAgent,
  listenToTasks, updateTask, deleteTask, listenToFolders,
  listenToUserSessions, createNewSession, deleteSession,
  listenToDirectives, saveDirective, deleteDirective
} from './services/firestoreService';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [directives, setDirectives] = useState<Directive[]>([]);
  
  // State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.INDIVIDUAL);
  const [viewMode, setViewMode] = useState<'CHAT' | 'KANBAN'>('CHAT'); 
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([INITIAL_AGENTS[0].id]);
  const [processingAgentName, setProcessingAgentName] = useState<string | null>(null);
  const [isKBOpen, setIsKBOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument | null>(null);
  const [isDevilsAdvocate, setIsDevilsAdvocate] = useState(false); 
  const [isDeepResearch, setIsDeepResearch] = useState(false); 
  const [isHuddle, setIsHuddle] = useState(false); 
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false); 
  const [isDirectivesOpen, setIsDirectivesOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  // Model Selection (Default: Flash)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [isDarkMode]);

  useEffect(() => { if (user) initializeUserData(user.uid); }, [user]);

  useEffect(() => {
    if (!user) return;
    const u = user.uid;
    const un1 = listenToAgents(u, (data) => {
        setAgents(data);
        setSelectedAgentIds(prev => {
             const valid = prev.filter(id => data.find(a => a.id === id));
             return valid.length ? valid : (data[0] ? [data[0].id] : []);
        });
    });
    const un2 = listenToKnowledgeBase(u, setKnowledgeBase);
    const un3 = listenToFolders(u, setFolders);
    const un4 = listenToTasks(u, setTasks);
    const un5 = listenToUserSessions(u, (data) => {
        setSessions(data);
        if (!currentSessionId && data.length > 0) setCurrentSessionId(data[0].id);
        else if (!currentSessionId) handleCreateSession(ChatMode.INDIVIDUAL);
    });
    const un6 = listenToDirectives(u, setDirectives);

    return () => { un1(); un2(); un3(); un4(); un5(); un6(); };
  }, [user]);

  // Load messages for current session
  useEffect(() => {
    if (!user || !currentSessionId) return;
    setMessages([]); 
    const unsub = listenToMessages(user.uid, currentSessionId, setMessages);
    // Restore mode from session
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
        setChatMode(session.mode);
        setSelectedAgentIds(session.participantIds.length ? session.participantIds : [INITIAL_AGENTS[0].id]);
    }
    return () => unsub();
  }, [user, currentSessionId, sessions]);

  const handleCreateSession = async (mode: ChatMode) => {
      if (!user) return;
      const newId = generateId();
      const title = `New ${mode === ChatMode.INDIVIDUAL ? 'Chat' : mode === ChatMode.FOCUS_GROUP ? 'Focus Group' : 'Board Meeting'} ${new Date().toLocaleTimeString()}`;
      const initialParticipants = mode === ChatMode.WHOLE_SUITE ? agents.map(a=>a.id) : [agents[0].id];
      
      await createNewSession(user.uid, {
          id: newId,
          userId: user.uid,
          title,
          mode,
          participantIds: initialParticipants,
          createdAt: Date.now(),
          lastMessageAt: Date.now()
      });
      setCurrentSessionId(newId);
      setChatMode(mode);
      setSelectedAgentIds(initialParticipants);
      setViewMode('CHAT');
      setIsMobileMenuOpen(false);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!user || !currentSessionId) return;
    
    // Slash Commands
    if (text.startsWith('/')) {
        if (text === '/clear') { handleCreateSession(chatMode); return; }
        if (text === '/kb') { setIsKBOpen(true); return; }
        if (text === '/reset') { window.location.reload(); return; }
    }

    const userMsg: Message = {
      id: generateId(), senderId: user.uid, senderName: user.displayName || 'User',
      content: text, timestamp: Date.now(), isUser: true, attachments
    };

    await addMessage(user.uid, currentSessionId, userMsg);
    if (isHuddle) setIsHuddle(true); 

    // Mentions: Filter agents if @Name is used
    let targetAgents = agents.filter(a => selectedAgentIds.includes(a.id));
    const mentions = text.match(/@(\w+)/g);
    if (mentions) {
        const mentionedNames = mentions.map(m => m.substring(1).toLowerCase());
        const mentionedAgents = agents.filter(a => mentionedNames.some(n => a.name.toLowerCase().includes(n) || a.surname.toLowerCase().includes(n) || a.role.toLowerCase().includes(n)));
        if (mentionedAgents.length > 0) targetAgents = mentionedAgents;
    }

    const currentHistory = [...messages, userMsg];
    abortControllerRef.current = new AbortController();

    try {
        for (const agent of targetAgents) {
            if (abortControllerRef.current.signal.aborted) break;
            setProcessingAgentName(`${agent.name} ${agent.surname}`);

            const contextInstruction = chatMode !== ChatMode.INDIVIDUAL 
                ? `Collaborative discussion. Be concise.`
                : undefined;

            try {
                const result = await generateAgentResponse(
                  agent, targetAgents, currentHistory, knowledgeBase, 
                  contextInstruction, isDevilsAdvocate, isDeepResearch, canvasDoc?.content,
                  directives, selectedModel // Pass model choice
                );
                
                if (result.canvasUpdate) {
                    setCanvasDoc({
                        title: result.canvasUpdate.title,
                        content: result.canvasUpdate.content,
                        language: 'markdown',
                        lastUpdatedBy: agent.name,
                        lastUpdatedAt: Date.now()
                    });
                    setIsCanvasOpen(true);
                }

                let cleanedText = result.text;
                // KB extraction
                const kbMatch = cleanedText.match(/```json\s*(\{[\s\S]*?"new_kb_entry"[\s\S]*?\})\s*```/);
                if (kbMatch && kbMatch[1]) {
                    try { 
                        const d = JSON.parse(kbMatch[1]); 
                        if (d.new_kb_entry) {
                             addKnowledgeItem(user.uid, { id: generateId(), type: 'NOTE', folderId: null, title: d.new_kb_entry.title, category: d.new_kb_entry.category, content: d.new_kb_entry.content, createdBy: agent.name, timestamp: Date.now() });
                             cleanedText = cleanedText.replace(kbMatch[0], '').trim();
                        }
                    } catch {}
                }
                // Task extraction
                const taskMatch = cleanedText.match(/```json\s*(\{[\s\S]*?"new_task"[\s\S]*?\})\s*```/);
                if (taskMatch && taskMatch[1]) {
                    try {
                        const d = JSON.parse(taskMatch[1]);
                        if (d.new_task) {
                            updateTask(user.uid, { id: generateId(), title: d.new_task.title, description: d.new_task.description, priority: d.new_task.priority || 'MEDIUM', status: TaskStatus.TODO, assignee: d.new_task.assignee, dueDate: d.new_task.dueDate ? new Date(d.new_task.dueDate).getTime() : undefined, createdAt: Date.now() });
                            cleanedText = cleanedText.replace(taskMatch[0], '').trim();
                        }
                    } catch {}
                }

                const agentMsg: Message = {
                    id: generateId(), senderId: agent.id, senderName: agent.name,
                    content: cleanedText, timestamp: Date.now(), isUser: false,
                    groundingMetadata: result.groundingMetadata, chartData: result.chartData,
                    contextUsed: result.contextUsed,
                    canvasAction: result.canvasUpdate ? { type: 'UPDATE', title: result.canvasUpdate.title } : undefined
                };

                await addMessage(user.uid, currentSessionId, agentMsg);
                currentHistory.push(agentMsg); 

            } catch (e) { console.error(e); }
        }
    } catch (error) { console.error(error); } 
    finally { setProcessingAgentName(null); setIsHuddle(false); abortControllerRef.current = null; }
  };

  const handleRegenerate = async () => {
      if (messages.length === 0) return;
      const lastUserMsg = [...messages].reverse().find(m => m.isUser);
      if (lastUserMsg) handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
  };

  const handleStop = () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setProcessingAgentName(null);
  };

  if (loading) return <div className="h-screen bg-white dark:bg-avallen-900 flex items-center justify-center text-gray-900 dark:text-white transition-colors duration-300">Loading...</div>;
  if (!user) return <Auth />;

  const activeAgents = agents.filter(a => selectedAgentIds.includes(a.id));

  return (
    <div className="flex h-screen bg-white dark:bg-avallen-900 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar 
        agents={agents} selectedAgents={selectedAgentIds} chatMode={chatMode} viewMode={viewMode}
        sessions={sessions} currentSessionId={currentSessionId || ''} isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSelectAgent={(id) => {
             if (chatMode === ChatMode.INDIVIDUAL) setSelectedAgentIds([id]);
             else setSelectedAgentIds(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(x=>x!==id) : prev) : [...prev, id]);
        }}
        onSetMode={setChatMode} onSetViewMode={setViewMode}
        onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileMenuOpen(false); }}
        onCreateSession={handleCreateSession}
        onToggleKnowledgeBase={() => setIsKBOpen(true)} onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onOpenDirectives={() => setIsDirectivesOpen(true)}
        onLogout={logOut} onAddAgent={() => { setEditingAgent(null); setIsAgentModalOpen(true); }}
        onEditAgent={(a) => { setEditingAgent(a); setIsAgentModalOpen(true); }}
        isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      
      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                {viewMode === 'CHAT' ? (
                    <ChatArea 
                        messages={messages} onSendMessage={handleSendMessage} onRegenerate={handleRegenerate} onStop={handleStop}
                        processingAgentName={processingAgentName} activeAgents={activeAgents} chatMode={chatMode} isHuddleMode={isHuddle}
                        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                        isDeepResearch={isDeepResearch} onToggleDeepResearch={() => setIsDeepResearch(!isDeepResearch)}
                        isCanvasOpen={isCanvasOpen} onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
                        isDevilsAdvocate={isDevilsAdvocate} onToggleDevilsAdvocate={() => setIsDevilsAdvocate(!isDevilsAdvocate)}
                        selectedModel={selectedModel} onSelectModel={setSelectedModel}
                    />
                ) : (
                    <KanbanBoard 
                        tasks={tasks} agents={agents}
                        onUpdateTask={(t) => user && updateTask(user.uid, t)}
                        onDeleteTask={(id) => user && deleteTask(user.uid, id)}
                    />
                )}
            </div>
            <CanvasPanel 
                isOpen={isCanvasOpen} onClose={() => setIsCanvasOpen(false)} canvasDocument={canvasDoc}
                onUpdateContent={(newContent) => setCanvasDoc(prev => prev ? { ...prev, content: newContent, lastUpdatedBy: 'User' } : null)}
            />
        </div>
      </main>

      <KnowledgeBasePanel isOpen={isKBOpen} onClose={() => setIsKBOpen(false)} items={knowledgeBase} folders={folders} />
      <AgentModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSave={(a) => user && saveAgent(user.uid, a)} onDelete={(id) => user && deleteAgent(user.uid, id)} initialAgent={editingAgent} />
      <HowToUseModal isOpen={isHowToUseOpen} onClose={() => setIsHowToUseOpen(false)} />
      <DirectivesModal 
        isOpen={isDirectivesOpen} 
        onClose={() => setIsDirectivesOpen(false)} 
        directives={directives} 
        onSaveDirective={(d) => user && saveDirective(user.uid, d)} 
        onDeleteDirective={(id) => user && deleteDirective(user.uid, id)} 
      />
    </div>
  );
};

export default App;
