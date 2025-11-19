import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, logOut, enableDemoMode } from './services/firebase';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import KnowledgeBasePanel from './components/KnowledgeBasePanel';
import AgentModal from './components/AgentModal';
import KanbanBoard from './components/KanbanBoard';
import HowToUseModal from './components/HowToUseModal';
import CanvasPanel from './components/CanvasPanel';
import DirectivesModal from './components/DirectivesModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FocusGroupModal from './components/FocusGroupModal';
import { generateAgentResponse } from './services/geminiService';
import { INITIAL_AGENTS } from './constants';
import { Agent, Message, ChatMode, Attachment, KnowledgeItem, Task, TaskStatus, Folder, CanvasDocument, ChatSession, Directive } from './types';
import { 
  initializeUserData, listenToAgents, listenToKnowledgeBase, 
  listenToMessages, addMessage, updateMessage, addKnowledgeItem, saveAgent, deleteAgent,
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
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionModalMode, setSessionModalMode] = useState<ChatMode>(ChatMode.FOCUS_GROUP);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Permission Error State
  const [showPermissionError, setShowPermissionError] = useState(false);
  
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

  useEffect(() => { if (user) initializeUserData(user); }, [user]);

  // Listener for Firestore Permissions
  useEffect(() => {
      const handler = () => setShowPermissionError(true);
      window.addEventListener('firestore-permission-error', handler);
      return () => window.removeEventListener('firestore-permission-error', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const u = user.uid;
    const un1 = listenToAgents(u, (data) => {
        setAgents(data);
        // Ensure we maintain a valid selection if agents change
        setSelectedAgentIds(prev => {
             const valid = prev.filter(id => data.find(a => a.id === id));
             return valid.length ? valid : (data[0] ? [data[0].id] : [INITIAL_AGENTS[0].id]);
        });
    });
    const un2 = listenToKnowledgeBase(u, setKnowledgeBase);
    const un3 = listenToFolders(u, setFolders);
    const un4 = listenToTasks(u, setTasks);
    const un5 = listenToUserSessions(u, (data) => {
        setSessions(data);
    });
    const un6 = listenToDirectives(u, setDirectives);

    return () => { un1(); un2(); un3(); un4(); un5(); un6(); };
  }, [user]);

  // Separate effect for session initialization
  useEffect(() => {
      if (!user || currentSessionId || sessions.length > 0) return;
      if (sessions.length === 0 && agents.length > 0) {
           // Don't auto create here to avoid loops, sidebar handles init
           // But if truly empty, maybe create one?
           // handleCreateSession(ChatMode.INDIVIDUAL); 
      }
  }, [sessions, user, agents]);
  
  useEffect(() => {
      if (!currentSessionId && sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
      }
  }, [sessions, currentSessionId]);

  // Load messages for current session
  useEffect(() => {
    if (!user || !currentSessionId) return;
    // Don't just setMessages([]) blindly, it causes flashing. 
    // Only clear if we are actually switching sessions to avoid ghosting during re-renders.
    // However, the listener will handle the update.
    
    const unsub = listenToMessages(user.uid, currentSessionId, (serverMsgs) => {
        setMessages(current => {
            // Merge Logic: 
            // Keep any local messages that are SENDING or ERROR if they aren't in the server list yet.
            // This prevents messages from "disappearing" if Firestore write fails or is slow.
            const localPending = current.filter(m => (m.status === 'SENDING' || m.status === 'ERROR') && !serverMsgs.find(s => s.id === m.id));
            
            // If a message was SENDING and now appears in serverMsgs, the server version (without status) takes precedence.
            
            const merged = [...serverMsgs, ...localPending].sort((a, b) => a.timestamp - b.timestamp);
            return merged;
        });
    });
    return () => {
        setMessages([]); // Clear on unmount/switch
        unsub();
    };
  }, [user, currentSessionId]);

  // Update mode when session changes
  useEffect(() => {
      if (!currentSessionId || sessions.length === 0) return;
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
          setChatMode(prev => prev !== session.mode ? session.mode : prev);
          setSelectedAgentIds(prev => {
             const newIds = session.participantIds.length ? session.participantIds : [INITIAL_AGENTS[0].id];
             return JSON.stringify(prev) !== JSON.stringify(newIds) ? newIds : prev;
          });
      }
  }, [currentSessionId, sessions]);

  // Helper to create actual session in DB
  const executeCreateSession = async (mode: ChatMode, participantIds: string[], title?: string) => {
       if (!user) return;
       const newId = generateId();
       const finalTitle = title || `Chat ${new Date().toLocaleTimeString()}`;

       await createNewSession(user.uid, {
          id: newId,
          userId: user.uid,
          title: finalTitle,
          mode,
          participantIds,
          createdAt: Date.now(),
          lastMessageAt: Date.now()
      });
      
      setCurrentSessionId(newId);
      setChatMode(mode);
      setSelectedAgentIds(participantIds);
      setViewMode('CHAT');
      setIsMobileMenuOpen(false);
      setIsSessionModalOpen(false);
  };

  const handleCreateSession = async (mode: ChatMode) => {
      if (!user) return;
      
      if (mode === ChatMode.INDIVIDUAL || mode === ChatMode.FOCUS_GROUP) {
          setSessionModalMode(mode);
          setIsSessionModalOpen(true);
          return;
      }

      // Whole C-Suite (auto-create)
      let availableAgents = agents.length > 0 ? agents : INITIAL_AGENTS;
      const allAgentIds = availableAgents.map(a => a.id);
      await executeCreateSession(mode, allAgentIds, `Board Meeting ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`);
  };

  const handleSessionModalCreate = (name: string, participantIds: string[]) => {
      executeCreateSession(sessionModalMode, participantIds, name);
  };

  // Logic when clicking an agent in the sidebar
  const handleAgentSelect = (agentId: string) => {
      if (chatMode === ChatMode.INDIVIDUAL) {
          // INTELLIGENT SWITCHING:
          // 1. Check if we have an existing INDIVIDUAL session with this agent
          const existingSession = sessions.find(s => 
              s.mode === ChatMode.INDIVIDUAL && 
              s.participantIds.includes(agentId) && 
              s.participantIds.length === 1
          );

          if (existingSession) {
              setCurrentSessionId(existingSession.id);
              // Selected agents update handled by useEffect on currentSessionId
          } else {
              // 2. If not, create a new one
              const agent = agents.find(a => a.id === agentId) || INITIAL_AGENTS.find(a => a.id === agentId);
              executeCreateSession(ChatMode.INDIVIDUAL, [agentId], `Chat with ${agent?.name || 'Agent'}`);
          }
      } else {
          // In Focus Group / Board mode, we just toggle them in the current room (Huddle style)
          setSelectedAgentIds(prev => prev.includes(agentId) ? (prev.length > 1 ? prev.filter(x=>x!==agentId) : prev) : [...prev, agentId]);
      }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!user || !currentSessionId) return;
    
    // Slash Commands
    if (text.startsWith('/')) {
        if (text === '/clear') { 
            // Re-create current session type
            const currentSession = sessions.find(s => s.id === currentSessionId);
            if (currentSession) executeCreateSession(currentSession.mode, currentSession.participantIds, currentSession.title);
            return; 
        }
        if (text === '/kb') { setIsKBOpen(true); return; }
        if (text === '/reset') { window.location.reload(); return; }
    }

    const userMsg: Message = {
      id: generateId(), senderId: user.uid, senderName: user.displayName || 'User',
      content: text, timestamp: Date.now(), isUser: true, attachments,
      status: 'SENDING' // Initial status
    };

    // 1. Optimistic Update
    setMessages(prev => [...prev, userMsg]);

    // 2. Try to save to DB
    try {
        await addMessage(user.uid, currentSessionId, userMsg);
        // If successful, we update the local status to 'undefined' (SENT)
        setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: undefined } : m));
    } catch (error) {
        console.error("Failed to send message:", error);
        // Mark as error so it doesn't disappear and user knows
        setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: 'ERROR' } : m));
        return; // STOP here if message failed. Do not generate agent response.
    }
    
    if (isHuddle) setIsHuddle(true); 

    // Mentions logic
    const currentAgents = agents.length > 0 ? agents : INITIAL_AGENTS;
    let targetAgents = currentAgents.filter(a => selectedAgentIds.includes(a.id));
    
    const mentions = text.match(/@(\w+)/g);
    if (mentions) {
        const mentionedNames = mentions.map(m => m.substring(1).toLowerCase());
        const mentionedAgents = currentAgents.filter(a => mentionedNames.some(n => a.name.toLowerCase().includes(n) || a.surname.toLowerCase().includes(n) || a.role.toLowerCase().includes(n)));
        if (mentionedAgents.length > 0) targetAgents = mentionedAgents;
    }
    
    if (targetAgents.length === 0) targetAgents = [currentAgents[0]];

    // Ensure we include the latest message in history for context
    // Filter out any error messages from context
    const currentHistory = [...messages.filter(m => m.status !== 'ERROR'), { ...userMsg, status: undefined }];
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
                  directives, selectedModel
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
                    emailDraft: result.emailDraft,
                    calendarEvent: result.calendarEvent,
                    contextUsed: result.contextUsed,
                    canvasAction: result.canvasUpdate ? { type: 'UPDATE', title: result.canvasUpdate.title } : undefined,
                    status: 'SENDING'
                };

                // OPTIMISTIC UPDATE for Agent Message
                setMessages(prev => [...prev, agentMsg]);

                try {
                    await addMessage(user.uid, currentSessionId, agentMsg);
                    // If successful, update status locally
                    setMessages(prev => prev.map(m => m.id === agentMsg.id ? { ...m, status: undefined } : m));
                    currentHistory.push(agentMsg); 
                } catch (e) {
                    console.error("Failed to save agent message", e);
                    // Mark as error locally
                    setMessages(prev => prev.map(m => m.id === agentMsg.id ? { ...m, status: 'ERROR' } : m));
                }

            } catch (e) { 
                console.error("Agent generation error", e);
                // Create an error message in the chat so the user knows it failed
                const errorMsg: Message = {
                    id: generateId(),
                    senderId: 'system',
                    senderName: 'System',
                    content: `**System Error:** Unable to generate response from ${agent.name}. (${e instanceof Error ? e.message : 'Unknown error'})`,
                    timestamp: Date.now(),
                    isUser: false,
                    status: 'ERROR'
                };
                setMessages(prev => [...prev, errorMsg]); 
            }
        }
    } catch (error) { 
        console.error("Global chat error", error); 
    } finally { 
        setProcessingAgentName(null); 
        setIsHuddle(false); 
        abortControllerRef.current = null; 
    }
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

  const handleMessageFeedback = async (messageId: string, type: 'UP' | 'DOWN') => {
      if (user && currentSessionId) {
          const message = messages.find(m => m.id === messageId);
          if (message) {
              await updateMessage(user.uid, currentSessionId, { ...message, feedback: type });
          }
      }
  };

  if (loading) return <div className="h-screen bg-white dark:bg-avallen-900 flex items-center justify-center text-gray-900 dark:text-white transition-colors duration-300">Loading...</div>;
  if (!user) return <Auth />;

  const activeAgents = agents.length > 0 
     ? agents.filter(a => selectedAgentIds.includes(a.id)) 
     : INITIAL_AGENTS.filter(a => selectedAgentIds.includes(a.id));

  return (
    <div className="flex h-screen bg-white dark:bg-avallen-900 overflow-hidden font-sans transition-colors duration-300 relative">
      
      {/* Permission Error Overlay */}
      {showPermissionError && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-avallen-800 max-w-lg w-full rounded-xl shadow-2xl p-6 border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                      <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
                      <h2 className="text-xl font-bold">Database Access Denied</h2>
                  </div>
                  
                  <div className="text-sm text-gray-700 dark:text-slate-300 space-y-4 mb-6">
                      <p>Your application is trying to save data to Firestore, but the request was blocked. This usually happens for two reasons:</p>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>You are using the <strong>default project keys</strong> provided in the source code, which do not allow write access (read-only).</li>
                          <li>You created your own Firebase project but haven't configured the <strong>Firestore Security Rules</strong> to allow user access.</li>
                      </ul>

                      <div className="bg-gray-100 dark:bg-avallen-900 p-3 rounded text-xs font-mono overflow-x-auto border border-gray-200 dark:border-avallen-700">
                        <p className="text-gray-500 mb-1">// Recommended Firestore Rules</p>
                        rules_version = '2';<br/>
                        service cloud.firestore {'{'}<br/>
                        &nbsp;&nbsp;match /databases/{'{database}'}/documents {'{'}<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;match /users/{'{userId}'}/{'{document=**}'} {'{'}<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if request.auth != null && request.auth.uid == userId;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
                        &nbsp;&nbsp;{'}'}<br/>
                        {'}'}
                      </div>
                  </div>

                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={enableDemoMode}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                         <i className="fa-solid fa-flask"></i> Switch to Demo Mode
                      </button>
                      <p className="text-center text-xs text-gray-500">Demo mode saves data to your browser (Local Storage) instead of the cloud.</p>
                      
                      <button 
                        onClick={() => setShowPermissionError(false)}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white mt-2"
                      >
                          Dismiss (App may be broken)
                      </button>
                  </div>
              </div>
          </div>
      )}

      <Sidebar 
        agents={agents.length ? agents : INITIAL_AGENTS} 
        selectedAgents={selectedAgentIds} chatMode={chatMode} viewMode={viewMode}
        sessions={sessions} currentSessionId={currentSessionId || ''} isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSelectAgent={handleAgentSelect}
        onSetMode={setChatMode} onSetViewMode={setViewMode}
        onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileMenuOpen(false); }}
        onCreateSession={handleCreateSession}
        onToggleKnowledgeBase={() => setIsKBOpen(true)} onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onOpenDirectives={() => setIsDirectivesOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
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
                        onFeedback={handleMessageFeedback}
                    />
                ) : (
                    <KanbanBoard 
                        tasks={tasks} agents={agents.length ? agents : INITIAL_AGENTS}
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
      <AnalyticsDashboard 
        isOpen={isAnalyticsOpen} 
        onClose={() => setIsAnalyticsOpen(false)} 
        tasks={tasks} 
        sessions={sessions} 
        agents={agents.length ? agents : INITIAL_AGENTS} 
      />
      <FocusGroupModal 
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        mode={sessionModalMode}
        agents={agents.length ? agents : INITIAL_AGENTS}
        onCreate={handleSessionModalCreate}
      />
    </div>
  );
};

export default App;