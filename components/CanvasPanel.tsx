import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CanvasDocument } from '../types';

interface CanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvasDocument: CanvasDocument | null;
  onUpdateContent: (newContent: string) => void;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ isOpen, onClose, canvasDocument, onUpdateContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState('');

  useEffect(() => {
    if (canvasDocument) {
      setLocalContent(canvasDocument.content);
    }
  }, [canvasDocument]);

  useEffect(() => {
    if ((window as any).mermaid) {
        try {
            (window as any).mermaid.contentLoaded();
        } catch(e) { console.log("Mermaid render error", e)}
    }
  }, [localContent, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateContent(localContent);
    setIsEditing(false);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(localContent);
      alert("Content copied to clipboard!");
  };

  const handleDownload = () => {
      const blob = new Blob([localContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${canvasDocument?.title || 'canvas_doc'}.md`;
      a.click();
  };

  return (
    <div className="w-1/2 min-w-[400px] border-l-3 border-black bg-neo-paper dark:bg-neutral-900 flex flex-col h-full shadow-neo-xl transition-all duration-300 ease-in-out z-10">
        {/* Header */}
        <div className="h-16 border-b-3 border-black flex items-center justify-between px-6 bg-white dark:bg-neutral-800">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500 border-2 border-black flex items-center justify-center shadow-neo-sm">
                    <i className="fa-solid fa-pen-ruler text-white"></i>
                </div>
                <div>
                    <h2 className="font-black text-black dark:text-white text-lg uppercase tracking-tight">Canvas</h2>
                    <p className="text-[10px] font-bold uppercase text-gray-500 bg-gray-100 inline-block px-1 border border-black">{canvasDocument?.title || 'Untitled'}</p>
                </div>
            </div>
            <div className="flex gap-2">
                 <button onClick={handleCopy} className="w-8 h-8 bg-white border-2 border-black hover:bg-yellow-200 text-black shadow-neo-sm flex items-center justify-center transition-all" title="Copy">
                    <i className="fa-regular fa-copy"></i>
                </button>
                <button onClick={handleDownload} className="w-8 h-8 bg-white border-2 border-black hover:bg-blue-200 text-black shadow-neo-sm flex items-center justify-center transition-all" title="Download">
                    <i className="fa-solid fa-download"></i>
                </button>
                <button onClick={onClose} className="w-8 h-8 bg-white border-2 border-black hover:bg-red-500 hover:text-white text-black shadow-neo-sm flex items-center justify-center transition-all" title="Close">
                    <i className="fa-solid fa-times"></i>
                </button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="h-12 bg-gray-100 dark:bg-neutral-900 border-b-3 border-black flex items-center px-4 justify-between">
            <div className="flex gap-2">
                 <span className="text-xs font-black uppercase mt-1.5 mr-2 text-black dark:text-white">Mode:</span>
                 <button 
                    onClick={() => setIsEditing(false)}
                    className={`text-xs px-3 py-1 font-black border-2 border-black uppercase transition-all ${!isEditing ? 'bg-black text-white shadow-neo-sm' : 'bg-white text-black hover:bg-gray-200'}`}
                 >
                    View
                 </button>
                 <button 
                    onClick={() => setIsEditing(true)}
                    className={`text-xs px-3 py-1 font-black border-2 border-black uppercase transition-all ${isEditing ? 'bg-black text-white shadow-neo-sm' : 'bg-white text-black hover:bg-gray-200'}`}
                 >
                    Edit
                 </button>
            </div>
            <div className="text-[10px] font-bold uppercase bg-white border border-black px-2 py-1 text-black">
                Updated by {canvasDocument?.lastUpdatedBy || 'System'}
            </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-neutral-800 bg-pattern">
            {isEditing ? (
                <textarea 
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    className="w-full h-full bg-white dark:bg-neutral-900 text-black dark:text-white font-mono text-sm outline-none resize-none border-2 border-black p-4 shadow-neo"
                    placeholder="# Start writing..."
                    onBlur={handleSave}
                />
            ) : (
                <div className="markdown-body p-6 bg-white border-2 border-black shadow-neo min-h-full">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {localContent || "*Canvas is empty.*"}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    </div>
  );
};

export default CanvasPanel;