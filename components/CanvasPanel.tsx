
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
    // Re-initialize mermaid if it exists in window
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
    <div className="w-1/2 min-w-[400px] border-l border-gray-200 dark:border-avallen-700 bg-white dark:bg-avallen-900 flex flex-col h-full shadow-2xl transition-all duration-300 ease-in-out z-10">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-avallen-700 flex items-center justify-between px-6 bg-white dark:bg-avallen-800 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-pen-ruler text-white"></i>
                </div>
                <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-sm">Canvas</h2>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">{canvasDocument?.title || 'Untitled Document'}</p>
                </div>
            </div>
            <div className="flex gap-2">
                 <button onClick={handleCopy} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-avallen-700" title="Copy">
                    <i className="fa-regular fa-copy"></i>
                </button>
                <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-avallen-700" title="Download">
                    <i className="fa-solid fa-download"></i>
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-avallen-700" title="Close Canvas">
                    <i className="fa-solid fa-times"></i>
                </button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="h-10 bg-gray-50 dark:bg-avallen-800/50 border-b border-gray-200 dark:border-avallen-700 flex items-center px-4 justify-between transition-colors duration-300">
            <div className="flex gap-2">
                 <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase font-bold tracking-wider mt-1">Mode:</span>
                 <button 
                    onClick={() => setIsEditing(false)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${!isEditing ? 'bg-avallen-600 text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                 >
                    View
                 </button>
                 <button 
                    onClick={() => setIsEditing(true)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${isEditing ? 'bg-avallen-600 text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                 >
                    Edit
                 </button>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-slate-500">
                Last updated by {canvasDocument?.lastUpdatedBy || 'System'}
            </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-avallen-900 transition-colors duration-300">
            {isEditing ? (
                <textarea 
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    className="w-full h-full bg-transparent text-gray-800 dark:text-slate-200 font-mono text-sm outline-none resize-none"
                    placeholder="# Start writing..."
                    onBlur={handleSave} // Auto save on blur
                />
            ) : (
                <div className="markdown-body prose prose-slate dark:prose-invert max-w-none">
                    {/* Render Mermaid diagrams manually if detected, else normal MD */}
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