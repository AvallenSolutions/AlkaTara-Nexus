
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KnowledgeItem, Folder } from '../types';
import { addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, createFolder, deleteFolder } from '../services/firestoreService';
import { autoFormatKnowledge, analyzeFile } from '../services/geminiService';
import { useAuth } from '../services/firebase';

interface KnowledgeBasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: KnowledgeItem[];
  folders?: Folder[];
}

type ViewMode = 'GRID' | 'FORM';
type UploadType = 'NOTE' | 'FILE' | 'LINK';

const generateId = () => Math.random().toString(36).substr(2, 9);

const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({ isOpen, onClose, items, folders = [] }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [uploadType, setUploadType] = useState<UploadType>('NOTE');

  // Folder Creation State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Form Data
  const [formData, setFormData] = useState<{
      id?: string;
      title: string; 
      category: string; 
      content: string; 
      url?: string; 
      fileData?: string; 
      fileMimeType?: string;
      fileName?: string;
  }>({ title: '', category: 'STRATEGY', content: '' });

  const [isLoading, setIsLoading] = useState(false);

  // Reset when folder changes or closed
  useEffect(() => {
      if (!isOpen) {
          setSearchQuery('');
          setViewMode('GRID');
          setIsCreatingFolder(false);
      }
  }, [isOpen]);

  const currentFolder = folders.find(f => f.id === currentFolderId);
  
  const filteredItems = useMemo(() => {
      return items.filter(item => {
          const matchesFolder = item.folderId === currentFolderId;
          const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                item.content.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesFolder && matchesSearch;
      });
  }, [items, currentFolderId, searchQuery]);

  const handleCreateFolder = async () => {
      if (!user || !newFolderName.trim()) return;
      
      await createFolder(user.uid, {
          id: generateId(),
          name: newFolderName.trim(),
          createdAt: Date.now()
      });
      
      setIsCreatingFolder(false);
      setNewFolderName('');
  };

  const handleDeleteFolder = async (id: string) => {
      if (!user) return;
      if (confirm("Delete this folder? Files inside will remain but become unorganized.")) {
          await deleteFolder(user.uid, id);
          if (currentFolderId === id) setCurrentFolderId(null);
      }
  };

  const handleStartUpload = (type: UploadType) => {
      setUploadType(type);
      setFormData({ title: '', category: 'STRATEGY', content: '' });
      
      if (type === 'FILE') {
          fileInputRef.current?.click();
      } else {
          setViewMode('FORM');
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsLoading(true);
          
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              
              // Analyze with AI
              const analysis = await analyzeFile(base64Data, file.type);
              
              setFormData({
                  title: analysis?.title || file.name,
                  category: analysis?.category || 'OTHER',
                  content: analysis?.summary || 'No summary available.',
                  fileData: base64Data,
                  fileMimeType: file.type,
                  fileName: file.name
              });
              
              setIsLoading(false);
              setViewMode('FORM');
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAutoFormatNote = async () => {
      if (!formData.content) return;
      setIsLoading(true);
      const result = await autoFormatKnowledge(formData.content);
      if (result) {
          setFormData(prev => ({ ...prev, ...result }));
      }
      setIsLoading(false);
  };

  const handleSave = async () => {
      if (!user || !formData.title) return;
      setIsLoading(true);

      const itemToSave: KnowledgeItem = {
          id: formData.id || generateId(),
          title: formData.title,
          category: formData.category as any,
          content: formData.content,
          type: uploadType,
          folderId: currentFolderId,
          url: formData.url,
          fileData: formData.fileData,
          fileMimeType: formData.fileMimeType,
          fileName: formData.fileName,
          createdBy: user.displayName || 'User',
          timestamp: Date.now()
      };

      try {
          if (formData.id) {
              await updateKnowledgeItem(user.uid, itemToSave);
          } else {
              await addKnowledgeItem(user.uid, itemToSave);
          }
          setViewMode('GRID');
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteItem = async (id: string) => {
      if (user && confirm("Delete this item?")) {
          await deleteKnowledgeItem(user.uid, id);
      }
  };
  
  const handleEditItem = (item: KnowledgeItem) => {
      setFormData({
          id: item.id,
          title: item.title,
          category: item.category,
          content: item.content,
          url: item.url,
          fileData: item.fileData,
          fileMimeType: item.fileMimeType,
          fileName: item.fileName
      });
      setUploadType(item.type);
      setViewMode('FORM');
  };

  // Icons based on file type
  const getFileIcon = (mime?: string) => {
      if (!mime) return 'fa-file';
      if (mime.includes('pdf')) return 'fa-file-pdf text-red-400';
      if (mime.includes('image')) return 'fa-file-image text-purple-400';
      if (mime.includes('sheet') || mime.includes('csv')) return 'fa-file-excel text-green-400';
      return 'fa-file-alt text-gray-400';
  };

  const downloadFile = (item: KnowledgeItem) => {
      if (item.fileData && item.fileMimeType) {
          const link = document.createElement('a');
          link.href = `data:${item.fileMimeType};base64,${item.fileData}`;
          link.download = item.fileName || 'download';
          link.click();
      }
  };

  return (
    <div className={`fixed inset-0 md:left-auto md:w-[800px] bg-gray-50 dark:bg-avallen-900 shadow-2xl transform transition-transform duration-300 z-30 border-l border-gray-200 dark:border-avallen-700 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-avallen-700 flex items-center justify-between px-6 bg-white dark:bg-avallen-800 transition-colors duration-300">
         <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
            <i className="fa-solid fa-database text-yellow-500"></i> Knowledge Base
         </h2>
         <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
            <i className="fa-solid fa-times text-lg"></i>
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR: FOLDERS */}
          <div className="w-64 bg-gray-100 dark:bg-avallen-900 border-r border-gray-200 dark:border-avallen-700 flex flex-col transition-colors duration-300">
              <div className="p-4 border-b border-gray-200 dark:border-avallen-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Folders</span>
                  <button onClick={() => setIsCreatingFolder(true)} className="text-avallen-accent hover:text-sky-600 dark:hover:text-white">
                      <i className="fa-solid fa-plus"></i>
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <button 
                    onClick={() => setCurrentFolderId(null)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm ${!currentFolderId ? 'bg-white dark:bg-avallen-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-avallen-800/50'}`}
                  >
                      <i className="fa-solid fa-folder-open text-yellow-500"></i> All Files
                  </button>

                  {/* Inline Folder Creation */}
                  {isCreatingFolder && (
                      <div className="px-3 py-2 bg-gray-200 dark:bg-avallen-800/50 rounded flex items-center gap-2 animate-fade-in">
                           <i className="fa-solid fa-folder text-gray-500"></i>
                           <input 
                              id="new-folder-input"
                              type="text" 
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateFolder();
                                  if (e.key === 'Escape') setIsCreatingFolder(false);
                              }}
                              className="bg-transparent border-b border-avallen-accent text-gray-900 dark:text-white text-sm w-28 outline-none"
                              placeholder="Name..."
                              autoFocus
                           />
                           <button onClick={handleCreateFolder} className="text-green-600 dark:text-green-400 hover:text-green-500 text-xs"><i className="fa-solid fa-check"></i></button>
                           <button onClick={() => setIsCreatingFolder(false)} className="text-red-600 dark:text-red-400 hover:text-red-500 text-xs"><i className="fa-solid fa-times"></i></button>
                      </div>
                  )}

                  {folders.map(folder => (
                      <div key={folder.id} className="group relative">
                          <button 
                            onClick={() => setCurrentFolderId(folder.id)}
                            className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm ${currentFolderId === folder.id ? 'bg-white dark:bg-avallen-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-avallen-800/50'}`}
                          >
                              <i className="fa-solid fa-folder text-gray-500 dark:text-slate-500"></i> 
                              <span className="truncate">{folder.name}</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-red-500 hidden group-hover:block"
                          >
                              <i className="fa-solid fa-times text-xs"></i>
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          {/* MAIN: CONTENT */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-avallen-800/30 transition-colors duration-300">
              
              {viewMode === 'GRID' && (
                  <>
                    {/* Actions Toolbar */}
                    <div className="p-4 border-b border-gray-200 dark:border-avallen-700 flex gap-4 items-center bg-white dark:bg-transparent">
                        <div className="flex-1 relative">
                             <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                             <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded pl-8 pr-4 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-avallen-accent"
                                placeholder="Search current folder..."
                             />
                        </div>
                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,image/*" />
                            <button onClick={() => handleStartUpload('FILE')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-avallen-700 hover:bg-gray-300 dark:hover:bg-avallen-600 text-gray-800 dark:text-white text-xs rounded border border-gray-300 dark:border-avallen-600 transition-colors">
                                <i className="fa-solid fa-cloud-upload-alt"></i> Upload
                            </button>
                            <button onClick={() => handleStartUpload('LINK')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-avallen-700 hover:bg-gray-300 dark:hover:bg-avallen-600 text-gray-800 dark:text-white text-xs rounded border border-gray-300 dark:border-avallen-600 transition-colors">
                                <i className="fa-solid fa-link"></i> Link
                            </button>
                            <button onClick={() => handleStartUpload('NOTE')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-avallen-700 hover:bg-gray-300 dark:hover:bg-avallen-600 text-gray-800 dark:text-white text-xs rounded border border-gray-300 dark:border-avallen-600 transition-colors">
                                <i className="fa-solid fa-sticky-note"></i> Note
                            </button>
                        </div>
                    </div>
                    
                    {/* Breadcrumbs */}
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-slate-500 flex items-center gap-2">
                        <span>Knowledge Base</span>
                        <i className="fa-solid fa-chevron-right text-[10px]"></i>
                        <span className="text-gray-900 dark:text-white font-bold">{currentFolder?.name || 'All Files'}</span>
                    </div>

                    {/* Grid */}
                    <div className="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start flex-1">
                        {isLoading && (
                             <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                                 <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-avallen-accent"></i>
                                 <p>Processing...</p>
                             </div>
                        )}
                        {!isLoading && filteredItems.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed border-gray-300 dark:border-avallen-700 rounded-xl">
                                <i className="fa-solid fa-box-open text-4xl mb-2 opacity-50"></i>
                                <p>This folder is empty.</p>
                            </div>
                        )}
                        
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white dark:bg-avallen-900 border border-gray-200 dark:border-avallen-700 hover:border-avallen-accent rounded-lg p-3 flex flex-col group transition-all relative h-32 shadow-sm">
                                {/* Type Icon */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-avallen-800 flex items-center justify-center">
                                        {item.type === 'FILE' && <i className={`fa-solid ${getFileIcon(item.fileMimeType)} text-lg`}></i>}
                                        {item.type === 'LINK' && <i className="fa-solid fa-link text-blue-500 dark:text-blue-400 text-lg"></i>}
                                        {item.type === 'NOTE' && <i className="fa-solid fa-sticky-note text-yellow-500 text-lg"></i>}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-avallen-900/80 rounded shadow-sm">
                                        {item.type === 'FILE' && (
                                            <button onClick={() => downloadFile(item)} className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white" title="Download">
                                                <i className="fa-solid fa-download"></i>
                                            </button>
                                        )}
                                        {item.type === 'LINK' && item.url && (
                                             <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white" title="Open Link">
                                                <i className="fa-solid fa-external-link-alt"></i>
                                             </a>
                                        )}
                                        <button onClick={() => handleEditItem(item)} className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                                            <i className="fa-solid fa-pen"></i>
                                        </button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-gray-500 dark:text-slate-400 hover:text-red-500">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1" title={item.title}>{item.title}</h4>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-2">{item.content}</p>
                                
                                <div className="mt-auto pt-2 flex justify-between items-center">
                                    <span className="text-[9px] px-1.5 rounded bg-gray-100 dark:bg-avallen-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-avallen-700">{item.category}</span>
                                    <span className="text-[9px] text-gray-400 dark:text-slate-600">{new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                  </>
              )}

              {/* Form View (Upload/Edit) */}
              {viewMode === 'FORM' && (
                  <div className="p-6 flex-1 flex flex-col overflow-y-auto">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {formData.id ? 'Edit Item' : `New ${uploadType === 'FILE' ? 'File Upload' : uploadType === 'LINK' ? 'Link' : 'Note'}`}
                          </h3>
                          <button onClick={() => setViewMode('GRID')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                      </div>

                      <div className="space-y-4 max-w-lg mx-auto w-full">
                          {isLoading ? (
                              <div className="text-center py-10">
                                  <i className="fa-solid fa-circle-notch fa-spin text-3xl text-avallen-accent mb-4"></i>
                                  <p className="text-gray-500 dark:text-slate-300">Analyzing content with Gemini...</p>
                              </div>
                          ) : (
                              <>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Title</label>
                                      <input 
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-white dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-avallen-accent"
                                      />
                                  </div>
                                  
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Category</label>
                                      <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-white dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-avallen-accent"
                                      >
                                          {['STRATEGY', 'KPI', 'LEGAL', 'PRODUCT', 'OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>

                                  {uploadType === 'LINK' && (
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">URL</label>
                                          <input 
                                            type="text" 
                                            value={formData.url || ''}
                                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                                            className="w-full bg-white dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-avallen-accent"
                                            placeholder="https://..."
                                          />
                                          <button 
                                            onClick={() => setFormData({...formData, content: 'Analyzed content would go here...'})} // Mock auto-fetch
                                            className="text-xs text-avallen-accent mt-1 hover:underline"
                                          >
                                              Auto-fetch & Summarize
                                          </button>
                                      </div>
                                  )}

                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                          {uploadType === 'FILE' ? 'AI Summary' : 'Content'}
                                      </label>
                                      <textarea 
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                        className="w-full bg-white dark:bg-avallen-900 border border-gray-300 dark:border-avallen-600 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-avallen-accent h-32 resize-none"
                                      />
                                      {uploadType === 'NOTE' && (
                                          <button onClick={handleAutoFormatNote} className="text-xs text-purple-500 dark:text-purple-400 mt-1 hover:text-purple-700 dark:hover:text-purple-300">
                                              <i className="fa-solid fa-wand-magic-sparkles"></i> Auto-Format with AI
                                          </button>
                                      )}
                                  </div>

                                  <button 
                                    onClick={handleSave}
                                    disabled={!formData.title}
                                    className="w-full bg-avallen-accent text-white font-bold py-2 rounded shadow-lg hover:bg-sky-400 transition-colors disabled:opacity-50"
                                  >
                                      Save Item
                                  </button>
                              </>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePanel;