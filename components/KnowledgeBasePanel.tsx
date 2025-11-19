
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KnowledgeItem, Folder } from '../types';
import { addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, createFolder, deleteFolder } from '../services/firestoreService';
import { autoFormatKnowledge, analyzeFile, analyzeUrl } from '../services/geminiService';
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

  // Delete States (replace window.confirm)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  // Reset when folder changes or closed
  useEffect(() => {
      if (!isOpen) {
          setSearchQuery('');
          setViewMode('GRID');
          setIsCreatingFolder(false);
          setDeletingFolderId(null);
          setDeletingItemId(null);
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

  const handleConfirmDeleteFolder = async (id: string) => {
      if (!user) return;
      await deleteFolder(user.uid, id);
      if (currentFolderId === id) setCurrentFolderId(null);
      setDeletingFolderId(null);
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

  const handleFetchUrl = async () => {
      if (!formData.url) return;
      setIsFetchingUrl(true);
      const result = await analyzeUrl(formData.url);
      if (result) {
          setFormData(prev => ({
              ...prev,
              title: result.title,
              category: result.category,
              content: result.summary
          }));
      } else {
          setFormData(prev => ({ ...prev, content: "Failed to analyze URL. Please try again or check if the site allows scraping." }));
      }
      setIsFetchingUrl(false);
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

  const handleConfirmDeleteItem = async (id: string) => {
      if (user) {
          await deleteKnowledgeItem(user.uid, id);
      }
      setDeletingItemId(null);
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
      if (mime.includes('pdf')) return 'fa-file-pdf text-red-600';
      if (mime.includes('word') || mime.includes('document')) return 'fa-file-word text-blue-600';
      if (mime.includes('image')) return 'fa-file-image text-purple-600';
      if (mime.includes('sheet') || mime.includes('csv')) return 'fa-file-excel text-green-600';
      return 'fa-file-alt text-gray-600';
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
    <div className={`fixed inset-0 md:left-auto md:w-[800px] bg-white dark:bg-neutral-900 border-l-3 border-black shadow-neo-xl transform transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="h-16 border-b-3 border-black flex items-center justify-between px-6 bg-neo-paper dark:bg-neutral-800">
         <h2 className="font-black text-black dark:text-white flex items-center gap-2 text-lg uppercase tracking-tight">
            <i className="fa-solid fa-database text-black"></i> Knowledge Base
         </h2>
         <button onClick={onClose} className="w-8 h-8 bg-white border-2 border-black text-black hover:bg-red-500 hover:text-white transition-colors shadow-neo-sm flex items-center justify-center">
            <i className="fa-solid fa-times text-lg"></i>
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR: FOLDERS */}
          <div className="w-64 bg-gray-50 dark:bg-neutral-900 border-r-3 border-black flex flex-col">
              <div className="p-4 border-b-3 border-black flex justify-between items-center bg-white dark:bg-neutral-800">
                  <span className="text-xs font-black text-black dark:text-white uppercase bg-yellow-300 px-1 border border-black">Folders</span>
                  <button onClick={() => setIsCreatingFolder(true)} className="w-6 h-6 bg-neo-primary text-white border-2 border-black flex items-center justify-center hover:shadow-neo-sm active:translate-y-[1px] transition-all">
                      <i className="fa-solid fa-plus text-xs"></i>
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <button 
                    onClick={() => setCurrentFolderId(null)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-bold border-2 transition-all ${!currentFolderId ? 'bg-black text-white border-black shadow-neo-sm' : 'bg-white text-black border-black hover:bg-gray-100'}`}
                  >
                      <i className="fa-solid fa-folder-open text-yellow-500"></i> All Files
                  </button>

                  {/* Inline Folder Creation */}
                  {isCreatingFolder && (
                      <div className="px-2 py-2 bg-white border-2 border-black shadow-neo-sm flex items-center gap-2">
                           <input 
                              id="new-folder-input"
                              type="text" 
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateFolder();
                                  if (e.key === 'Escape') setIsCreatingFolder(false);
                              }}
                              className="bg-gray-100 border-b-2 border-black text-black text-xs w-24 outline-none font-bold"
                              placeholder="NAME..."
                              autoFocus
                           />
                           <button onClick={handleCreateFolder} className="text-green-600 hover:bg-green-100 px-1"><i className="fa-solid fa-check"></i></button>
                           <button onClick={() => setIsCreatingFolder(false)} className="text-red-600 hover:bg-red-100 px-1"><i className="fa-solid fa-times"></i></button>
                      </div>
                  )}

                  {folders.map(folder => (
                      <div key={folder.id} className="group relative">
                          <button 
                            onClick={() => setCurrentFolderId(folder.id)}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-bold border-2 transition-all ${currentFolderId === folder.id ? 'bg-black text-white border-black shadow-neo-sm' : 'bg-white text-black border-black hover:bg-gray-100'}`}
                          >
                              <i className="fa-solid fa-folder text-yellow-500"></i> 
                              <span className="truncate">{folder.name}</span>
                          </button>
                          
                          {/* Delete Folder Logic */}
                          {deletingFolderId === folder.id ? (
                              <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 bg-red-500 px-1 border-2 border-black z-10">
                                  <button onClick={() => handleConfirmDeleteFolder(folder.id)} className="text-white font-black text-[10px] hover:underline">YES</button>
                                  <button onClick={() => setDeletingFolderId(null)} className="text-white font-black text-[10px] hover:underline">NO</button>
                              </div>
                          ) : (
                              <button 
                                onClick={() => setDeletingFolderId(folder.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-red-600 hidden group-hover:block z-10 bg-white border border-black w-5 h-5 flex items-center justify-center"
                              >
                                  <i className="fa-solid fa-times text-xs"></i>
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {/* MAIN: CONTENT */}
          <div className="flex-1 flex flex-col bg-neo-bg dark:bg-neutral-900 transition-colors duration-300 bg-pattern">
              
              {viewMode === 'GRID' && (
                  <>
                    {/* Actions Toolbar */}
                    <div className="p-4 border-b-3 border-black flex gap-4 items-center bg-white dark:bg-neutral-800">
                        <div className="flex-1 relative">
                             <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xs"></i>
                             <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 border-2 border-black pl-8 pr-4 py-2 text-sm font-bold text-black dark:text-white outline-none focus:shadow-neo transition-shadow placeholder-gray-500"
                                placeholder="SEARCH..."
                             />
                        </div>
                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,image/*" />
                            {[
                                { type: 'FILE', icon: 'fa-cloud-upload-alt', label: 'Upload' },
                                { type: 'LINK', icon: 'fa-link', label: 'Link' },
                                { type: 'NOTE', icon: 'fa-sticky-note', label: 'Note' }
                            ].map(btn => (
                                <button 
                                    key={btn.type}
                                    onClick={() => handleStartUpload(btn.type as UploadType)} 
                                    className="flex items-center gap-2 px-3 py-2 bg-white text-black text-xs font-black border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase"
                                >
                                    <i className={`fa-solid ${btn.icon}`}></i> <span className="hidden md:inline">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Breadcrumbs */}
                    <div className="px-4 py-2 text-xs flex items-center gap-2 border-b-2 border-black bg-yellow-100 dark:bg-neutral-700">
                        <span className="font-bold uppercase">KB</span>
                        <i className="fa-solid fa-caret-right text-[10px]"></i>
                        <span className="font-black uppercase">{currentFolder?.name || 'All Files'}</span>
                    </div>

                    {/* Grid */}
                    <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 content-start flex-1">
                        {isLoading && (
                             <div className="col-span-full flex flex-col items-center justify-center py-20">
                                 <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                                 <p className="font-black uppercase">Processing...</p>
                             </div>
                        )}
                        {!isLoading && filteredItems.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-black bg-white/50">
                                <i className="fa-solid fa-box-open text-4xl mb-2 opacity-50"></i>
                                <p className="font-bold uppercase">Folder Empty</p>
                            </div>
                        )}
                        
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white dark:bg-neutral-800 border-2 border-black shadow-neo p-3 flex flex-col group relative h-36 hover:-translate-y-1 transition-transform">
                                {/* Type Icon */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-8 h-8 border-2 border-black bg-gray-100 flex items-center justify-center shadow-sm">
                                        {item.type === 'FILE' && <i className={`fa-solid ${getFileIcon(item.fileMimeType)} text-lg`}></i>}
                                        {item.type === 'LINK' && <i className="fa-solid fa-link text-blue-500 text-lg"></i>}
                                        {item.type === 'NOTE' && <i className="fa-solid fa-sticky-note text-yellow-500 text-lg"></i>}
                                    </div>
                                    
                                    <div className="flex gap-1">
                                        {deletingItemId === item.id ? (
                                            <div className="flex items-center gap-1 px-1 bg-red-500 border-2 border-black">
                                                <button onClick={() => handleConfirmDeleteItem(item.id)} className="text-[10px] font-black text-white hover:underline">DEL</button>
                                                <button onClick={() => setDeletingItemId(null)} className="text-[10px] font-black text-white hover:underline">X</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.type === 'FILE' && (
                                                    <button onClick={() => downloadFile(item)} className="w-6 h-6 border-2 border-black bg-white hover:bg-gray-200 flex items-center justify-center text-black text-xs" title="Download">
                                                        <i className="fa-solid fa-download"></i>
                                                    </button>
                                                )}
                                                {item.type === 'LINK' && item.url && (
                                                     <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 border-2 border-black bg-white hover:bg-gray-200 flex items-center justify-center text-black text-xs" title="Open">
                                                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                                     </a>
                                                )}
                                                <button onClick={() => handleEditItem(item)} className="w-6 h-6 border-2 border-black bg-yellow-300 hover:bg-yellow-400 flex items-center justify-center text-black text-xs">
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button onClick={() => setDeletingItemId(item.id)} className="w-6 h-6 border-2 border-black bg-red-400 hover:bg-red-500 flex items-center justify-center text-black text-xs">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <h4 className="text-sm font-black text-black dark:text-white truncate mb-1 uppercase leading-tight" title={item.title}>{item.title}</h4>
                                <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 line-clamp-2 font-mono bg-gray-100 dark:bg-neutral-900 p-1 border border-gray-300 dark:border-gray-700">{item.content}</p>
                                
                                <div className="mt-auto pt-2 flex justify-between items-center border-t-2 border-black border-dashed">
                                    <span className="text-[9px] px-1 font-bold bg-black text-white uppercase">{item.category}</span>
                                    <span className="text-[9px] font-bold text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                  </>
              )}

              {/* Form View (Upload/Edit) */}
              {viewMode === 'FORM' && (
                  <div className="p-6 flex-1 flex flex-col overflow-y-auto bg-white dark:bg-neutral-800">
                      <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
                          <h3 className="text-lg font-black text-black dark:text-white uppercase">
                              {formData.id ? 'Edit Item' : `New ${uploadType}`}
                          </h3>
                          <button onClick={() => setViewMode('GRID')} className="text-xs font-bold underline text-red-500 hover:text-red-700 uppercase">Cancel</button>
                      </div>

                      <div className="space-y-4 max-w-lg mx-auto w-full">
                          {isLoading ? (
                              <div className="text-center py-10">
                                  <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                                  <p className="font-black uppercase animate-pulse">Analyzing...</p>
                              </div>
                          ) : (
                              <>
                                  <div>
                                      <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-yellow-300 inline-block px-1 border border-black">Title</label>
                                      <input 
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-white dark:bg-neutral-900 border-2 border-black p-3 text-sm font-bold outline-none focus:shadow-neo transition-shadow"
                                      />
                                  </div>
                                  
                                  <div>
                                      <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-yellow-300 inline-block px-1 border border-black">Category</label>
                                      <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-white dark:bg-neutral-900 border-2 border-black p-3 text-sm font-bold outline-none focus:shadow-neo transition-shadow"
                                      >
                                          {['STRATEGY', 'KPI', 'LEGAL', 'PRODUCT', 'OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>

                                  {uploadType === 'LINK' && (
                                      <div>
                                          <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-yellow-300 inline-block px-1 border border-black">URL</label>
                                          <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={formData.url || ''}
                                                onChange={(e) => setFormData({...formData, url: e.target.value})}
                                                className="flex-1 bg-white dark:bg-neutral-900 border-2 border-black p-3 text-sm font-bold outline-none focus:shadow-neo transition-shadow"
                                                placeholder="https://..."
                                            />
                                            <button 
                                                onClick={handleFetchUrl} 
                                                disabled={!formData.url || isFetchingUrl}
                                                className="bg-blue-500 text-white px-4 py-2 font-black border-2 border-black shadow-neo-sm hover:bg-blue-600 disabled:bg-gray-400 uppercase text-xs"
                                            >
                                                {isFetchingUrl ? <i className="fa-solid fa-spinner fa-spin"></i> : 'FETCH'}
                                            </button>
                                          </div>
                                      </div>
                                  )}

                                  <div>
                                      <label className="block text-xs font-black text-black dark:text-white uppercase mb-1 bg-yellow-300 inline-block px-1 border border-black">
                                          {uploadType === 'FILE' ? 'AI Summary' : 'Content'}
                                      </label>
                                      <textarea 
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                        className="w-full bg-white dark:bg-neutral-900 border-2 border-black p-3 text-sm font-mono outline-none focus:shadow-neo transition-shadow h-40 resize-none"
                                      />
                                      {uploadType === 'NOTE' && (
                                          <button onClick={handleAutoFormatNote} className="text-xs font-bold bg-neo-primary text-white px-2 py-1 border-2 border-black mt-2 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                              <i className="fa-solid fa-wand-magic-sparkles"></i> AUTO-FORMAT
                                          </button>
                                      )}
                                  </div>

                                  <button 
                                    onClick={handleSave}
                                    disabled={!formData.title}
                                    className="w-full bg-neo-secondary text-black font-black py-3 border-2 border-black shadow-neo hover:bg-emerald-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase mt-4"
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
