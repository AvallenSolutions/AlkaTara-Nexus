
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Agent, ChatMode, Attachment, ChartData, EmailDraft, CalendarEvent } from '../types';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onRegenerate: () => void; 
  onStop: () => void; 
  processingAgentName: string | null;
  activeAgents: Agent[];
  chatMode: ChatMode;
  isHuddleMode?: boolean;
  onOpenMobileMenu: () => void; 
  
  // Tool States
  isDeepResearch: boolean;
  onToggleDeepResearch: () => void;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  isDevilsAdvocate: boolean;
  onToggleDevilsAdvocate: () => void;
  
  // Model Selection
  selectedModel: string;
  onSelectModel: (model: string) => void;
  
  // Feedback
  onFeedback: (messageId: string, type: 'UP' | 'DOWN') => void;
}

const SimpleChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const maxVal = Math.max(...data.datasets[0].data, 100);
    return (
        <div className="bg-gray-50 dark:bg-avallen-900/50 rounded-lg p-4 my-3 border border-gray-200 dark:border-avallen-700">
            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-4 text-center">{data.title}</h4>
            {data.type === 'BAR' && (
                <div className="flex items-end justify-around h-40 gap-2">
                    {data.labels.map((label, i) => {
                         const val = data.datasets[0].data[i] || 0;
                         const height = (val / maxVal) * 100;
                         return (
                             <div key={i} className="flex flex-col items-center w-full group">
                                 <div className="w-full bg-gray-300 dark:bg-avallen-700 rounded-t relative overflow-hidden transition-all hover:bg-gray-400 dark:hover:bg-avallen-600" style={{ height: `${height}%` }}>
                                    <div className="absolute bottom-0 w-full bg-avallen-accent opacity-50 h-full"></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                                        {val}
                                    </div>
                                 </div>
                                 <span className="text-[10px] text-gray-500 dark:text-slate-500 mt-2 truncate w-full text-center">{label}</span>
                             </div>
                         );
                    })}
                </div>
            )}
            {data.type !== 'BAR' && (
                 <div className="flex justify-center py-4">
                     <div className="text-center text-sm text-gray-400 dark:text-slate-400 italic">
                         <i className={`fa-solid ${data.type === 'PIE' ? 'fa-chart-pie' : 'fa-chart-line'} text-4xl mb-2 block text-avallen-accent`}></i>
                         {data.title} (Visualization not fully implemented for {data.type})
                     </div>
                 </div>
            )}
        </div>
    );
};

const EmailCard: React.FC<{ draft: EmailDraft }> = ({ draft }) => (
    <div className="bg-blue-50 dark:bg-avallen-800/50 border border-blue-100 dark:border-avallen-600 rounded-xl p-4 my-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="flex justify-between items-start mb-3">
             <h4 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                 <i className="fa-solid fa-envelope text-blue-500"></i> Email Draft
             </h4>
             <a href={`mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                 Open Mail <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
             </a>
        </div>
        <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
            <p><span className="font-bold text-gray-400">To:</span> {draft.to}</p>
            <p><span className="font-bold text-gray-400">Subject:</span> {draft.subject}</p>
        </div>
        <div className="mt-3 p-3 bg-white dark:bg-avallen-900 rounded border border-gray-100 dark:border-avallen-700 text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
            {draft.body}
        </div>
    </div>
);

const CalendarCard: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startTime.replace(/[-:]/g, '')}/${event.endTime.replace(/[-:]/g, '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location || '')}`;
    
    return (
    <div className="bg-orange-50 dark:bg-avallen-800/50 border border-orange-100 dark:border-avallen-600 rounded-xl p-4 my-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
        <div className="flex justify-between items-start mb-3">
             <h4 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                 <i className="fa-solid fa-calendar-check text-orange-500"></i> Calendar Invite
             </h4>
             <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                 Add to Calendar <i className="fa-solid fa-plus text-[10px]"></i>
             </a>
        </div>
        <div className="text-xs text-gray-700 dark:text-slate-300 space-y-2">
            <p className="font-bold text-base">{event.title}</p>
            <div className="flex items-center gap-4 text-gray-500 dark:text-slate-400">
                <p><i className="fa-regular fa-clock mr-1"></i> {new Date(event.startTime).toLocaleString()} </p>
                {event.location && <p><i className="fa-solid fa-location-dot mr-1"></i> {event.location}</p>}
            </div>
            <p className="italic opacity-80">{event.description}</p>
        </div>
    </div>
    );
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  onSendMessage, 
  onRegenerate,
  onStop,
  processingAgentName, 
  activeAgents,
  chatMode,
  isHuddleMode,
  onOpenMobileMenu,
  isDeepResearch,
  onToggleDeepResearch,
  isCanvasOpen,
  onToggleCanvas,
  isDevilsAdvocate,
  onToggleDevilsAdvocate,
  selectedModel,
  onSelectModel,
  onFeedback
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        shouldAutoScrollRef.current = isNearBottom;
    }
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) scrollToBottom();
  }, [messages, processingAgentName]);

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    shouldAutoScrollRef.current = true; 
    onSendMessage(inputText, attachments);
    setInputText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAttachments(prev => [...prev, {
          mimeType: file.type,
          data: base64String.split(',')[1],
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAgentVoice = (name: string) => {
      const agent = activeAgents.find(a => name.includes(a.name));
      return agent?.voiceURI;
  }

  const speakText = (text: string, voiceURI?: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      if (voiceURI) {
          const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURI);
          if (voice) utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Could show toast here
  };

  const toggleVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice input not supported.");
          return;
      }
      if (isListening) {
          setIsListening(false);
          return;
      }
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
          setInputText(prev => prev + ' ' + event.results[0][0].transcript);
      };
      recognition.start();
  };

  const handleExport = () => {
      const transcript = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderName}:\n${m.content}\n\n`).join('---\n\n');
      const blob = new Blob([transcript], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_export_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
  };

  // Custom Code Block Renderer for Copy Button
  const CodeBlock = ({node, inline, className, children, ...props}: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeText = String(children).replace(/\n$/, '');
      return !inline && match ? (
          <div className="relative group mt-2 mb-4">
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyToClipboard(codeText)} className="bg-gray-200 dark:bg-avallen-700 text-xs text-gray-700 dark:text-white px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-avallen-600">
                      Copy
                  </button>
              </div>
              <pre className={className} {...props}>
                  <code>{children}</code>
              </pre>
          </div>
      ) : (
          <code className={className} {...props}>{children}</code>
      );
  };

  const filteredMessages = messages.filter(m => 
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAgentAvatar = (name: string) => {
    const agent = activeAgents.find(a => name.includes(a.name));
    return agent?.avatarUrl || null;
  };

  const processingAgent = processingAgentName ? activeAgents.find(a => processingAgentName.includes(a.name)) : null;

  return (
    <div className="flex-1 flex flex-col h-full relative bg-gray-50 dark:bg-avallen-900 transition-colors duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-avallen-700 flex items-center px-4 md:px-6 justify-between bg-white/80 dark:bg-avallen-900/95 backdrop-blur sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
            <button onClick={onOpenMobileMenu} className="md:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                <i className="fa-solid fa-bars text-lg"></i>
            </button>
            
            <div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    {chatMode === ChatMode.INDIVIDUAL && activeAgents[0] 
                    ? `${activeAgents[0].name}`
                    : chatMode === ChatMode.FOCUS_GROUP ? 'Focus Group' : 'Whole Suite'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <span className={`flex h-2 w-2 rounded-full ${isHuddleMode ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`}></span>
                    {isHuddleMode ? <span className="text-purple-500 dark:text-purple-400 font-bold">Huddle</span> : <span className="truncate max-w-[200px]">{activeAgents.map(a => a.name).join(', ')}</span>}
                </div>
            </div>
        </div>

        <div className="flex gap-2 items-center">
            {showSearch ? (
                <div className="flex items-center bg-gray-100 dark:bg-avallen-800 rounded px-2 py-1 border border-gray-300 dark:border-avallen-600 animate-fade-in">
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white w-32"
                        autoFocus
                    />
                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white ml-2"><i className="fa-solid fa-times"></i></button>
                </div>
            ) : (
                <button onClick={() => setShowSearch(true)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white p-2" title="Search Chat"><i className="fa-solid fa-search"></i></button>
            )}
            <button onClick={handleExport} className="text-gray-400 dark:text-slate-400 hover:text-avallen-accent p-2" title="Export Chat"><i className="fa-solid fa-file-export"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        {filteredMessages.map((msg, idx) => {
            const avatarUrl = !msg.isUser ? getAgentAvatar(msg.senderName) : null;
            const isLast = idx === messages.length - 1;
            const voiceURI = !msg.isUser ? getAgentVoice(msg.senderName) : undefined;
            
            return (
            <div key={msg.id} className={`flex w-full ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[95%] md:max-w-[75%] gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md mt-1 overflow-hidden border border-white dark:border-avallen-600 ${msg.isUser ? 'bg-avallen-accent' : 'bg-slate-600 dark:bg-slate-700'}`}>
                        {msg.isUser ? <i className="fa-solid fa-user"></i> : avatarUrl ? <img src={avatarUrl} alt={msg.senderName} className="w-full h-full object-cover" /> : msg.senderName.charAt(0)}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} w-full min-w-0 group`}>
                        {!msg.isUser && <span className="text-xs text-gray-500 dark:text-slate-400 mb-1 ml-1 font-semibold">{msg.senderName}</span>}
                        
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed w-full relative transition-colors duration-300
                            ${msg.isUser ? 'bg-avallen-accent text-white rounded-tr-none' : 'bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-700 text-gray-800 dark:text-slate-200 rounded-tl-none'}
                            ${msg.status === 'SENDING' ? 'opacity-70' : ''}
                            ${msg.status === 'ERROR' ? 'border-red-500 dark:border-red-500' : ''}
                        `}>
                            {/* Context Indicator */}
                            {msg.contextUsed && (
                                <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity" title={`Context Used:\n${msg.contextUsed}`}>
                                    <i className="fa-solid fa-circle-info text-gray-400 dark:text-slate-500 hover:text-avallen-accent cursor-help"></i>
                                </div>
                            )}
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mb-2 space-y-2">
                                    {msg.attachments.map((att, i) => (
                                        <div key={i} className="text-xs bg-black/10 dark:bg-black/20 p-2 rounded flex items-center gap-2"><i className="fa-solid fa-paperclip"></i> {att.name}</div> 
                                    ))}
                                </div>
                            )}
                            
                            <div className="markdown-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                            </div>

                            {msg.chartData && <SimpleChart data={msg.chartData} />}
                            {msg.emailDraft && <EmailCard draft={msg.emailDraft} />}
                            {msg.calendarEvent && <CalendarCard event={msg.calendarEvent} />}
                            
                            {/* Grounding Sources */}
                            {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-avallen-700">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><i className="fa-brands fa-google"></i> Sources</p>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.groundingMetadata.groundingChunks.map((chunk, i) => (
                                            chunk.web?.uri && (
                                                <a 
                                                    key={i} 
                                                    href={chunk.web.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] bg-gray-100 dark:bg-avallen-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded border border-gray-200 dark:border-avallen-600 hover:border-blue-400 transition-colors flex items-center gap-1 max-w-xs truncate"
                                                >
                                                    <span className="truncate">{chunk.web.title || "Source"}</span>
                                                    <i className="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-70"></i>
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Message Actions Toolbar */}
                            {!msg.isUser && (
                                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-3 items-center">
                                        <button onClick={() => copyToClipboard(msg.content)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white" title="Copy Text"><i className="fa-regular fa-copy"></i></button>
                                        <button onClick={() => speakText(msg.content, voiceURI)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white" title="Read Aloud"><i className="fa-solid fa-volume-high"></i></button>
                                        
                                        {/* Feedback */}
                                        <div className="h-3 w-[1px] bg-gray-300 dark:bg-avallen-700 mx-1"></div>
                                        <button 
                                            onClick={() => onFeedback(msg.id, 'UP')} 
                                            className={`text-xs hover:text-green-500 ${msg.feedback === 'UP' ? 'text-green-500' : 'text-gray-400 dark:text-slate-500'}`}
                                        ><i className="fa-solid fa-thumbs-up"></i></button>
                                        <button 
                                            onClick={() => onFeedback(msg.id, 'DOWN')} 
                                            className={`text-xs hover:text-red-500 ${msg.feedback === 'DOWN' ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}
                                        ><i className="fa-solid fa-thumbs-down"></i></button>
                                    </div>
                                    {isLast && !processingAgentName && (
                                        <button onClick={onRegenerate} className="text-xs text-avallen-accent hover:text-sky-600 dark:hover:text-white flex items-center gap-1">
                                            <i className="fa-solid fa-rotate-right"></i> Regenerate
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Error / Status State */}
                            {msg.status === 'ERROR' && (
                                <div className="absolute -bottom-6 right-0 text-xs text-red-500 font-bold flex items-center gap-1 bg-white dark:bg-avallen-800 px-1 rounded">
                                    <i className="fa-solid fa-circle-exclamation"></i> Failed to send
                                </div>
                            )}
                            {msg.status === 'SENDING' && (
                                <div className="absolute -bottom-5 right-0 text-[10px] text-gray-400 italic">
                                    Sending...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            );
        })}
        
        {processingAgentName && (
            <div className="flex w-full justify-start animate-fade-in">
                 <div className="flex max-w-[85%] gap-3 items-end">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-white dark:border-avallen-600 shadow-sm mb-1 bg-gray-300 dark:bg-avallen-800">
                        {processingAgent?.avatarUrl ? <img src={processingAgent.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] text-white">{processingAgentName.charAt(0)}</span>}
                    </div>
                    <div className="bg-white dark:bg-avallen-800 border border-gray-200 dark:border-avallen-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-lg">
                        {isHuddleMode ? (
                             <span className="text-xs text-purple-500 dark:text-purple-400 font-bold animate-pulse flex items-center gap-2"><i className="fa-solid fa-people-arrows"></i> Consulting Team...</span>
                        ) : (
                            <>
                                <div className="flex space-x-1">
                                    <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{processingAgentName} is thinking...</span>
                                <button onClick={onStop} className="ml-2 text-red-400 hover:text-red-300" title="Stop Generation"><i className="fa-solid fa-stop-circle"></i></button>
                            </>
                        )}
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-50 dark:bg-avallen-900 border-t border-gray-200 dark:border-avallen-700 transition-colors duration-300">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide items-center">
             <div className="bg-white dark:bg-avallen-800 rounded-full border border-gray-200 dark:border-avallen-700 px-2 py-1 flex items-center gap-2 flex-shrink-0">
                 <i className="fa-solid fa-microchip text-gray-400 dark:text-slate-500 text-[10px]"></i>
                 <select 
                    value={selectedModel}
                    onChange={(e) => onSelectModel(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-gray-700 dark:text-slate-300 outline-none border-none cursor-pointer"
                 >
                    <option value="gemini-2.5-flash">Flash 2.5 (Fast)</option>
                    <option value="gemini-3-pro-preview">Pro 3.0 (Smartest)</option>
                 </select>
             </div>
             <div className="w-[1px] h-4 bg-gray-300 dark:bg-avallen-700 mx-1 flex-shrink-0"></div>
             <button onClick={onToggleDeepResearch} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border transition-colors flex-shrink-0 ${isDeepResearch ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-200 border-blue-300 dark:border-blue-500' : 'bg-white dark:bg-avallen-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-avallen-700'}`}><i className={`fa-solid ${isDeepResearch ? 'fa-magnifying-glass-chart' : 'fa-magnifying-glass'}`}></i> Deep Research</button>
             <button onClick={onToggleCanvas} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border transition-colors flex-shrink-0 ${isCanvasOpen ? 'bg-pink-100 dark:bg-pink-900/80 text-pink-600 dark:text-pink-200 border-pink-300 dark:border-pink-500' : 'bg-white dark:bg-avallen-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-avallen-700'}`}><i className={`fa-solid ${isCanvasOpen ? 'fa-pen-ruler' : 'fa-pen-to-square'}`}></i> Canvas</button>
             <button onClick={onToggleDevilsAdvocate} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border transition-colors flex-shrink-0 ${isDevilsAdvocate ? 'bg-red-100 dark:bg-red-900/80 text-red-600 dark:text-red-200 border-red-300 dark:border-red-500' : 'bg-white dark:bg-avallen-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-avallen-700'}`}><i className="fa-solid fa-fire"></i> Devil's Advocate</button>
        </div>

        {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2"><div className="text-xs text-gray-500">Attachments: {attachments.length}</div></div>
        )}

        <div className="relative flex items-end gap-2 bg-white dark:bg-avallen-800 border border-gray-300 dark:border-avallen-700 rounded-xl p-2 shadow-inner focus-within:border-avallen-accent/50 focus-within:ring-1 focus-within:ring-avallen-accent/50 transition-all">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 dark:text-slate-400 hover:text-avallen-accent rounded-lg hover:bg-gray-100 dark:hover:bg-avallen-700"><i className="fa-solid fa-paperclip"></i></button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.txt,.md,.csv" />
          <button onClick={toggleVoiceInput} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-avallen-700 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-slate-400 hover:text-avallen-accent'}`}><i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i></button>
          <textarea 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder={chatMode === ChatMode.FOCUS_GROUP ? "Msg Group (use @Name to mention)..." : "Type a message... (Try /clear, /kb)"}
            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 resize-none py-2 max-h-32 min-h-[44px]" 
            rows={1} 
          />
          <button onClick={handleSend} disabled={(!inputText.trim() && attachments.length === 0) || !!processingAgentName} className={`p-2 rounded-lg transition-all ${(!inputText.trim() && attachments.length === 0) || !!processingAgentName ? 'text-gray-400 dark:text-slate-600 bg-gray-100 dark:bg-avallen-700/50' : 'bg-avallen-accent text-white hover:bg-sky-400'}`}><i className="fa-solid fa-paper-plane"></i></button>
        </div>
        <div className="text-center mt-2"><p className="text-[10px] text-gray-500 dark:text-slate-600">AI can hallucinate. /clear to reset. @Name to mention.</p></div>
      </div>
    </div>
  );
};

export default ChatArea;
