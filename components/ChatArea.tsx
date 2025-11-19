
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Agent, ChatMode, Attachment, ChartData, EmailDraft, CalendarEvent } from '../types';
import { generateSpeech } from '../services/geminiService';

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
  isDeepResearch: boolean;
  onToggleDeepResearch: () => void;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  isDevilsAdvocate: boolean;
  onToggleDevilsAdvocate: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onFeedback: (messageId: string, type: 'UP' | 'DOWN') => void;
}

const SimpleChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const maxVal = Math.max(...data.datasets[0].data, 100);
    return (
        <div className="bg-white dark:bg-neutral-900 p-4 my-3 border-2 border-black shadow-neo">
            <h4 className="text-xs font-black text-black dark:text-white uppercase mb-4 text-center bg-neo-accent inline-block px-2 border border-black">{data.title}</h4>
            {data.type === 'BAR' && (
                <div className="flex items-end justify-around h-40 gap-2 border-b-2 border-black pb-1">
                    {data.labels.map((label, i) => {
                         const val = data.datasets[0].data[i] || 0;
                         const height = (val / maxVal) * 100;
                         return (
                             <div key={i} className="flex flex-col items-center w-full group relative">
                                 <div className="w-full bg-neo-primary border-2 border-black transition-all hover:bg-neo-secondary relative" style={{ height: `${height}%` }}>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 border border-white">
                                        {val}
                                    </div>
                                 </div>
                                 <span className="text-[10px] font-bold text-black dark:text-white mt-1 truncate w-full text-center uppercase">{label}</span>
                             </div>
                         );
                    })}
                </div>
            )}
            {data.type !== 'BAR' && (
                 <div className="flex justify-center py-4">
                     <div className="text-center text-sm font-bold border-2 border-dashed border-black p-4">
                         <i className={`fa-solid ${data.type === 'PIE' ? 'fa-chart-pie' : 'fa-chart-line'} text-4xl mb-2 block text-neo-primary`}></i>
                         Visual not available.
                     </div>
                 </div>
            )}
        </div>
    );
};

const EmailCard: React.FC<{ draft: EmailDraft }> = ({ draft }) => (
    <div className="bg-white dark:bg-neutral-900 border-2 border-black shadow-neo p-4 my-3 relative">
        <div className="absolute -top-3 -left-3 bg-blue-500 text-white border-2 border-black px-2 py-0.5 text-xs font-bold shadow-sm transform -rotate-2">EMAIL DRAFT</div>
        <div className="flex justify-between items-start mb-3 mt-2">
             <div className="text-xs font-mono space-y-1">
                 <p><span className="font-bold bg-black text-white px-1">TO</span> {draft.to}</p>
                 <p><span className="font-bold bg-black text-white px-1">SUBJ</span> {draft.subject}</p>
             </div>
             <a href={`mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-500 text-white border-2 border-black px-3 py-1.5 font-bold hover:shadow-neo-sm transition-all flex items-center gap-1">
                 OPEN <i className="fa-solid fa-arrow-up-right-from-square"></i>
             </a>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-black border-2 border-black text-xs font-mono whitespace-pre-wrap">
            {draft.body}
        </div>
    </div>
);

const CalendarCard: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startTime.replace(/[-:]/g, '')}/${event.endTime.replace(/[-:]/g, '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location || '')}`;
    return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-black shadow-neo p-4 my-3 relative">
        <div className="absolute -top-3 -left-3 bg-orange-500 text-white border-2 border-black px-2 py-0.5 text-xs font-bold shadow-sm transform rotate-2">INVITE</div>
        <div className="flex justify-between items-start mb-3 mt-2">
             <h4 className="font-black text-lg uppercase">{event.title}</h4>
             <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-orange-500 text-white border-2 border-black px-3 py-1.5 font-bold hover:shadow-neo-sm transition-all flex items-center gap-1">
                 ADD <i className="fa-solid fa-plus"></i>
             </a>
        </div>
        <div className="text-xs font-bold space-y-2">
            <div className="flex items-center gap-4 border-b-2 border-black pb-2">
                <p><i className="fa-regular fa-clock mr-1"></i> {new Date(event.startTime).toLocaleString()} </p>
                {event.location && <p><i className="fa-solid fa-location-dot mr-1"></i> {event.location}</p>}
            </div>
            <p className="italic opacity-80 font-mono bg-gray-100 dark:bg-black p-2 border border-black">{event.description}</p>
        </div>
    </div>
    );
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, onSendMessage, onRegenerate, onStop, processingAgentName, activeAgents, chatMode, isHuddleMode, onOpenMobileMenu, isDeepResearch, onToggleDeepResearch, isCanvasOpen, onToggleCanvas, isDevilsAdvocate, onToggleDevilsAdvocate, selectedModel, onSelectModel, onFeedback
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScrollRef = useRef(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map());
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getAudioContext = () => {
      if (!audioCtxRef.current) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new Ctx();
      }
      return audioCtxRef.current;
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  useEffect(() => { if (shouldAutoScrollRef.current) scrollToBottom(); }, [messages, processingAgentName]);

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    shouldAutoScrollRef.current = true; 
    onSendMessage(inputText, attachments);
    setInputText(''); setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAttachments(prev => [...prev, { mimeType: file.type, data: base64String.split(',')[1], name: file.name }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanTextForTTS = (text: string): string => {
      let clean = text.replace(/[*#_`>~]/g, '');
      clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      clean = clean.replace(/https?:\/\/\S+/g, 'link');
      return clean.trim();
  };

  const speakText = async (text: string, agent?: Agent, messageId?: string) => {
      if (!messageId) return;
      if (currentSourceRef.current) { try { currentSourceRef.current.stop(); } catch (e) {} currentSourceRef.current = null; }
      if (playingMessageId === messageId) { setPlayingMessageId(null); return; }
      const cleanedText = cleanTextForTTS(text);
      if (!cleanedText) return;
      const voiceName = agent?.voiceURI || 'Kore';
      const cacheKey = `${messageId}-${voiceName}`;
      try {
          const ctx = getAudioContext();
          if (ctx.state === 'suspended') await ctx.resume();
          let buffer: AudioBuffer | null = null;
          if (audioCache.current.has(cacheKey)) buffer = audioCache.current.get(cacheKey)!;
          else {
              setLoadingAudioId(messageId);
              buffer = await generateSpeech(cleanedText, voiceName, ctx);
              if (buffer) audioCache.current.set(cacheKey, buffer);
              setLoadingAudioId(null);
          }
          if (buffer) {
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => { setPlayingMessageId(null); currentSourceRef.current = null; };
              currentSourceRef.current = source;
              setPlayingMessageId(messageId);
              source.start(0);
          }
      } catch (e: any) { setLoadingAudioId(null); setPlayingMessageId(null); }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const toggleVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window)) { alert("Not supported."); return; }
      if (isListening) { setIsListening(false); return; }
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => setInputText(prev => prev + ' ' + event.results[0][0].transcript);
      recognition.start();
  };

  const handleExport = () => {
      const transcript = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderName}:\n${m.content}\n\n`).join('---\n\n');
      const blob = new Blob([transcript], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `chat_export.md`; a.click();
  };

  const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.senderName.toLowerCase().includes(searchQuery.toLowerCase()));

  const getAgentAvatar = (senderId: string, senderName: string) => {
    const agent = activeAgents.find(a => a.id === senderId) || activeAgents.find(a => senderName.includes(a.name));
    return agent?.avatarUrl || null;
  };

  const getAgentForMessage = (msg: Message) => activeAgents.find(a => a.id === msg.senderId) || activeAgents.find(a => msg.senderName.includes(a.name));
  const processingAgent = processingAgentName ? activeAgents.find(a => processingAgentName.includes(a.name)) : null;

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white dark:bg-neutral-900 transition-colors duration-300 bg-pattern">
      {/* Header */}
      <div className="h-16 border-b-3 border-black flex items-center px-4 justify-between bg-neo-paper dark:bg-neutral-800 sticky top-0 z-10 shadow-neo-sm">
        <div className="flex items-center gap-3">
            <button onClick={onOpenMobileMenu} className="md:hidden border-2 border-black px-2 bg-white"><i className="fa-solid fa-bars"></i></button>
            <div>
                <h2 className="font-black text-xl text-black dark:text-white uppercase tracking-tight">
                    {chatMode === ChatMode.INDIVIDUAL && activeAgents[0] ? `${activeAgents[0].name}` : chatMode === ChatMode.FOCUS_GROUP ? 'Focus Group' : 'C-Suite Board'}
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold">
                    <div className={`px-1 border border-black ${isHuddleMode ? 'bg-neo-pink animate-pulse' : 'bg-neo-secondary'} text-black`}>
                        {isHuddleMode ? 'HUDDLE' : 'ACTIVE'}
                    </div>
                    <span className="truncate max-w-[200px] text-gray-600 dark:text-gray-400">{activeAgents.map(a => a.name).join(', ')}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 items-center">
            {showSearch ? (
                <div className="flex items-center bg-white border-2 border-black p-1 shadow-neo-sm">
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH..."
                        className="bg-transparent outline-none text-sm font-mono w-32 text-black"
                        autoFocus
                    />
                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-black px-1 font-bold">X</button>
                </div>
            ) : (
                <button onClick={() => setShowSearch(true)} className="border-2 border-black bg-white text-black p-2 hover:bg-yellow-200 transition-colors shadow-neo-sm active:shadow-none"><i className="fa-solid fa-search"></i></button>
            )}
            <button onClick={handleExport} className="border-2 border-black bg-white text-black p-2 hover:bg-blue-200 transition-colors shadow-neo-sm active:shadow-none"><i className="fa-solid fa-file-export"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        {filteredMessages.map((msg, idx) => {
            const avatarUrl = !msg.isUser ? getAgentAvatar(msg.senderId, msg.senderName) : null;
            const isLast = idx === messages.length - 1;
            const agent = !msg.isUser ? getAgentForMessage(msg) : undefined;
            const isPlaying = playingMessageId === msg.id;
            
            return (
            <div key={msg.id} className={`flex w-full ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[95%] md:max-w-[80%] gap-0 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 border-2 border-black flex-shrink-0 flex items-center justify-center z-10 ${msg.isUser ? 'bg-black text-white' : 'bg-white'}`}>
                        {msg.isUser ? <i className="fa-solid fa-user"></i> : avatarUrl ? <img src={avatarUrl} alt={msg.senderName} className="w-full h-full object-cover" /> : msg.senderName.charAt(0)}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} w-full min-w-0 group -mx-2 mb-2`}>
                        {!msg.isUser && <span className="text-xs font-black bg-black text-white px-1 mb-1 ml-2 transform -rotate-1 uppercase border border-white">{msg.senderName}</span>}
                        
                        <div className={`relative border-3 border-black p-4 shadow-neo text-sm leading-relaxed w-full
                            ${msg.isUser ? 'bg-neo-secondary text-black' : 'bg-white dark:bg-neutral-800 dark:text-white text-black'}
                            ${msg.status === 'SENDING' ? 'opacity-70' : ''}
                            ${isPlaying ? 'ring-4 ring-yellow-400' : ''}
                        `}>
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mb-2 space-y-2">
                                    {msg.attachments.map((att, i) => (
                                        <div key={i} className="text-xs bg-white border border-black p-1 inline-block font-mono font-bold"><i className="fa-solid fa-paperclip"></i> {att.name}</div> 
                                    ))}
                                </div>
                            )}
                            
                            <div className="markdown-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>

                            {msg.chartData && <SimpleChart data={msg.chartData} />}
                            {msg.emailDraft && <EmailCard draft={msg.emailDraft} />}
                            {msg.calendarEvent && <CalendarCard event={msg.calendarEvent} />}
                            
                            {/* Sources */}
                            {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                                <div className="mt-4 pt-2 border-t-2 border-black border-dashed">
                                    <p className="text-[10px] font-black uppercase mb-1"><i className="fa-brands fa-google"></i> Sources</p>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.groundingMetadata.groundingChunks.map((chunk, i) => (
                                            chunk.web?.uri && (
                                                <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-yellow-200 text-black px-1 border border-black hover:bg-yellow-400 truncate max-w-[150px]">
                                                    {chunk.web.title || "Link"} <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Toolbar */}
                            {!msg.isUser && (
                                <div className="absolute -bottom-4 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => copyToClipboard(msg.content)} className="bg-white text-black border-2 border-black p-1 hover:bg-gray-100 text-xs" title="Copy"><i className="fa-regular fa-copy"></i></button>
                                    <button onClick={() => speakText(msg.content, agent, msg.id)} className={`bg-white text-black border-2 border-black p-1 hover:bg-gray-100 text-xs ${isPlaying ? 'bg-yellow-400' : ''}`} title="Speak">
                                        <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-volume-high'}`}></i>
                                    </button>
                                    <button onClick={() => onFeedback(msg.id, 'UP')} className={`bg-white text-black border-2 border-black p-1 hover:bg-green-200 text-xs ${msg.feedback === 'UP' ? 'bg-green-400' : ''}`}><i className="fa-solid fa-thumbs-up"></i></button>
                                    <button onClick={() => onFeedback(msg.id, 'DOWN')} className={`bg-white text-black border-2 border-black p-1 hover:bg-red-200 text-xs ${msg.feedback === 'DOWN' ? 'bg-red-400' : ''}`}><i className="fa-solid fa-thumbs-down"></i></button>
                                    {isLast && !processingAgentName && <button onClick={onRegenerate} className="bg-neo-primary text-white border-2 border-black p-1 hover:bg-purple-700 text-xs"><i className="fa-solid fa-rotate-right"></i></button>}
                                </div>
                            )}

                            {msg.status === 'ERROR' && (
                                <div className="absolute -bottom-8 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 border-2 border-black shadow-neo-sm">FAILED TO SEND</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            );
        })}
        
        {processingAgentName && (
            <div className="flex w-full justify-start pl-2">
                 <div className="flex items-end gap-2">
                    <div className="w-10 h-10 border-2 border-black bg-gray-300 flex items-center justify-center">
                        <i className="fa-solid fa-robot animate-bounce"></i>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 border-3 border-black p-3 shadow-neo rounded-none">
                        <div className="flex items-center gap-3">
                             <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-black dark:bg-white animate-bounce"></div>
                                <div className="w-2 h-2 bg-black dark:bg-white animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-black dark:bg-white animate-bounce delay-150"></div>
                             </div>
                             <span className="text-xs font-bold uppercase">{processingAgentName} thinking...</span>
                             <button onClick={onStop} className="bg-red-500 text-white border-2 border-black w-5 h-5 flex items-center justify-center hover:bg-red-600"><i className="fa-solid fa-stop text-xs"></i></button>
                        </div>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neo-paper dark:bg-neutral-900 border-t-3 border-black">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide items-center">
             <div className="bg-white text-black border-2 border-black px-2 py-1 flex items-center gap-2 shadow-neo-sm">
                 <i className="fa-solid fa-microchip text-xs"></i>
                 <select value={selectedModel} onChange={(e) => onSelectModel(e.target.value)} className="bg-transparent text-xs font-bold outline-none uppercase cursor-pointer text-black">
                    <option value="gemini-2.5-flash">Flash 2.5</option>
                    <option value="gemini-3-pro-preview">Pro 3.0</option>
                 </select>
             </div>
             <button onClick={onToggleDeepResearch} className={`px-2 py-1 text-xs font-bold border-2 border-black shadow-neo-sm transition-all ${isDeepResearch ? 'bg-blue-400 text-white translate-x-[2px] translate-y-[2px] shadow-none' : 'bg-white text-black hover:bg-blue-100'}`}>DEEP RESEARCH</button>
             <button onClick={onToggleCanvas} className={`px-2 py-1 text-xs font-bold border-2 border-black shadow-neo-sm transition-all ${isCanvasOpen ? 'bg-pink-400 text-white translate-x-[2px] translate-y-[2px] shadow-none' : 'bg-white text-black hover:bg-pink-100'}`}>CANVAS</button>
             <button onClick={onToggleDevilsAdvocate} className={`px-2 py-1 text-xs font-bold border-2 border-black shadow-neo-sm transition-all ${isDevilsAdvocate ? 'bg-red-500 text-white translate-x-[2px] translate-y-[2px] shadow-none' : 'bg-white text-black hover:bg-red-100'}`}>DEVIL'S ADVOCATE</button>
        </div>

        {attachments.length > 0 && <div className="text-xs font-bold mb-2 bg-yellow-200 text-black inline-block px-2 border border-black">{attachments.length} FILES ATTACHED</div>}

        <div className="flex gap-2">
            <div className="flex-1 relative">
                 <textarea 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="TYPE COMMAND..."
                    className="w-full bg-white dark:bg-neutral-800 border-3 border-black p-3 text-sm font-medium outline-none focus:shadow-neo transition-shadow resize-none h-14"
                 />
                 <div className="absolute right-2 bottom-2 flex gap-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-gray-200 hover:bg-gray-300 border-2 border-black text-xs text-black"><i className="fa-solid fa-paperclip"></i></button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={toggleVoiceInput} className={`p-1.5 border-2 border-black text-xs ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}><i className="fa-solid fa-microphone"></i></button>
                 </div>
            </div>
            <button 
                onClick={handleSend} 
                disabled={(!inputText.trim() && attachments.length === 0) || !!processingAgentName} 
                className="bg-neo-primary hover:bg-violet-600 disabled:bg-gray-300 text-white font-black border-3 border-black px-6 shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase"
            >
                SEND
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
