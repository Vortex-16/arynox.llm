import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, CheckCircle, Clock, Loader2, Database, 
  Search, Trash2
} from 'lucide-react';
import StudentInsights from './student_insights';
import logoSvg from '../assets/logo.svg';

// Simulated states for processing pipeline
type DocState = 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'ready' | 'error';
type TabState = 'onboarding' | 'insights' | 'settings' | 'classes';

interface DocumentFile {
  id: string;
  name: string;
  size: string;
  status: DocState;
  progress: number;
  fileUrl?: string;
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<TabState>('onboarding');
  
  // Onboarding State — empty on mount, loaded from MongoDB API below
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Metadata State
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    className: '1st Year',
    department: 'CSE',
    subject: '',
    module: ''
  });

  // Settings State
  const [isExamMode, setIsExamMode] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/documents');
        const data = await response.json();
        const mappedDocs = data.map((doc: any) => ({
          id: doc._id,
          name: doc.title,
          size: 'DB', // Representing saved in database
          status: 'ready',
          progress: 100,
          fileUrl: doc.fileUrl
        }));
        setDocuments(mappedDocs);
      } catch (error) {
        console.error("Failed to load textbooks from ChromaDB:", error);
      }
    };
    fetchDocuments();

    // Fetch Initial Settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/settings?department=CSE');
        const data = await res.json();
        setIsExamMode(data.isExamMode);
        setConfidenceThreshold(data.confidenceThreshold);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const updateBackendSettings = async (updates: any) => {
    try {
        await fetch('http://localhost:5000/api/settings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                department: 'CSE', // Hardcoded for demo/MVP
                isExamMode,
                confidenceThreshold,
                ...updates
            })
        });
    } catch (err) {
        console.error("Failed to update settings", err);
    }
  };

  const uploadToBackend = async (docId: string, file: File, meta: typeof uploadMetadata) => {
    // Start Animation Sequence
    const steps: { status: DocState; targetProgress: number; duration: number }[] = [
      { status: 'uploading', targetProgress: 20, duration: 800 },
      { status: 'parsing', targetProgress: 45, duration: 1500 },
      { status: 'chunking', targetProgress: 75, duration: 2000 },
      { status: 'embedding', targetProgress: 95, duration: 2500 }
    ];

    let currentStep = 0;
    let keepAnimating = true;

    const animateProgress = () => {
      if (!keepAnimating || currentStep >= steps.length) return;
      const step = steps[currentStep];
      setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, status: step.status } : doc));
      
      const ticks = 5;
      const tickDuration = step.duration / ticks;
      let currentTick = 1;

      const interval = setInterval(() => {
        if(!keepAnimating) { clearInterval(interval); return; }
        
        setDocuments(prev => prev.map(doc => {
          if (doc.id !== docId) return doc;
          const prevProgress = currentStep === 0 ? 0 : steps[currentStep - 1].targetProgress;
          const progressAdded = ((step.targetProgress - prevProgress) / ticks) * currentTick;
          return { ...doc, progress: prevProgress + progressAdded };
        }));

        currentTick++;
        if (currentTick > ticks) {
          clearInterval(interval);
          currentStep++;
          animateProgress();
        }
      }, tickDuration);
    };

    animateProgress();

    // Perform actual API Fetch concurrently
    try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', file.name);
        formData.append('department', meta.department);
        formData.append('className', meta.className);
        formData.append('subject', meta.subject);
        formData.append('module', meta.module);

        const apiResponse = await fetch('http://localhost:5000/api/documents/upload', {
            method: 'POST',
            body: formData
        });

        const data = await apiResponse.json();
        if (!apiResponse.ok) throw new Error(data.error || 'Upload failed');

        // Finish Animation Forcefully to Ready state and lock in fileUrl
        keepAnimating = false;
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, status: 'ready', progress: 100, fileUrl: data.documentMeta?.fileUrl } : doc
        ));

    } catch (error) {
        console.error("API Upload failed for", file.name, error);
        keepAnimating = false;
        setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, status: 'error' } : doc));
    }
  };

  const deleteDocumentHandler = async (docId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this document? This will remove its vectors from the AI knowledge base immediately.");
    if (!isConfirmed) return;
    
    // Optimistic delete from UI
    setDocuments(prev => prev.filter(d => d.id !== docId));
    
    try {
      const res = await fetch(`http://localhost:5000/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete from DB");
    } catch (err) {
      console.error(err);
      // Revert optimism by refetching
      window.location.reload();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setShowMetadataModal(true);
  };

  const confirmUpload = () => {
    if (pendingFiles.length === 0) return;
    setShowMetadataModal(false);

    const newDocs: DocumentFile[] = pendingFiles.map((f) => ({
      id: Math.random().toString(36).substring(7),
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading',
      progress: 0,
    }));
    
    setDocuments(prev => [...newDocs, ...prev]);
    
    pendingFiles.forEach((f, index) => {
        uploadToBackend(newDocs[index].id, f, uploadMetadata);
    });
    setPendingFiles([]);
  };

  const statusColors: Record<DocState, { color: string, bg: string, label: string, icon: React.ReactNode }> = {
    uploading: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Uploading Document...', icon: <Loader2 className="animate-spin w-5 h-5" /> },
    parsing: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Extracting Text & Parsing...', icon: <FileText className="animate-pulse w-5 h-5" /> },
    chunking: { color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Chunking Semantic Data...', icon: <Database className="animate-pulse w-5 h-5" /> },
    embedding: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Generating Embeddings...', icon: <Loader2 className="animate-spin w-5 h-5" /> },
    ready: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Ready for AI Access', icon: <CheckCircle className="w-5 h-5" /> },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed to Process', icon: <Clock className="w-5 h-5" /> }
  };

  return (
    <div className={`flex h-screen w-full text-white overflow-hidden font-['Outfit'] transition-colors duration-500 relative`}
      style={{ backgroundColor: (activeTab === 'onboarding' || activeTab === 'classes') ? '#20B2AA' : '#FF5458' }}>
      
      {/* Grain effect overlay */}
      <div className="grain-overlay" />
      
      {/* Upload Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-[500px] shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Set Document Metadata</h3>
            <p className="text-white/50 text-sm mb-6">Categorize these materials so only relevant students can access them.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Class / Year</label>
                <select 
                  value={uploadMetadata.className}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, className: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none [&>option]:bg-[#111]"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Department</label>
                <select 
                  value={uploadMetadata.department}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, department: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none [&>option]:bg-[#111]"
                >
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="MECH">Mechanical (MECH)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Subject Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Thermodynamics, Graph Theory"
                  value={uploadMetadata.subject}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, subject: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Module / Unit</label>
                <input 
                  type="text"
                  placeholder="e.g. Module 1, Midterm Review"
                  value={uploadMetadata.module}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, module: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {setShowMetadataModal(false); setPendingFiles([]);}} 
                className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpload} 
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-all"
              >
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="w-64 flex flex-col justify-between py-8 px-6 border-r-2 border-black z-20">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <img src={logoSvg} alt="Arynox Logo" className="h-16 w-auto" />
            <span className="text-[#F9E95C] font-extrabold text-2xl tracking-tight" style={{ fontFamily: "'Gabarito', sans-serif" }}>arynox.llm</span>
          </div>

          <nav className="flex flex-col gap-0">
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={`px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-black transition-all ${
                activeTab === 'onboarding' 
                ? 'bg-[#20B2AA] text-black' 
                : 'bg-white text-black hover:bg-[#20B2AA] hover:text-white'
              }`}
            >
              Knowledge Base
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-t-0 border-black transition-all ${
                activeTab === 'insights' 
                ? 'bg-[#FF5458] text-black' 
                : 'bg-white text-black hover:bg-[#FF5458] hover:text-white'
              }`}
            >
              Student Insights
            </button>
            <button 
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-t-0 border-black transition-all ${
                activeTab === 'classes' 
                ? 'bg-[#20B2AA] text-black' 
                : 'bg-white text-black hover:bg-[#20B2AA] hover:text-white'
              }`}
            >
              Classes Overview
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-t-0 border-black transition-all ${
                activeTab === 'settings' 
                ? 'bg-[#FF5458] text-black' 
                : 'bg-white text-black hover:bg-[#FF5458] hover:text-white'
              }`}
            >
              AI Controls
            </button>
          </nav>
        </div>

        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-black transition-all bg-white text-black hover:bg-[#FF5458] hover:text-white hover:border-[#FF5458] text-center mt-auto"
        >
          Sign Out
        </button>
      </aside>

      {/* 2. Main Studio Area */}
      <main className="flex-1 flex flex-col relative">
        
        <header className="px-6 py-3 flex justify-between items-center z-40 border-b-2 border-black bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-black uppercase tracking-wider">
              {activeTab === 'onboarding' ? 'Faculty Hub' : activeTab === 'insights' ? 'Student Insights' : activeTab === 'classes' ? 'Classes Overview' : 'AI Controls'}
            </h2>
            <p className="text-black/50 text-xs">
              {activeTab === 'onboarding' 
                ? 'Onboard your teaching materials directly to the AI core.' 
                : activeTab === 'insights'
                ? 'Monitor student interactions and knowledge gaps.'
                : activeTab === 'classes'
                ? 'View and manage your class sections.'
                : 'Configure AI behavior and pedagogical controls.'}
            </p>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input 
              type="text" 
              placeholder="Search..."
              className="pl-9 pr-3 py-1.5 w-56 border-2 border-black outline-none focus:border-black/70 transition-all text-black text-sm placeholder:text-black/30 bg-transparent"
            />
          </div>
        </header>

        <div className="px-10 pb-4 z-10 w-full mx-auto flex-1 overflow-y-auto flex flex-col">
          
          {/* ======================= */}
          {/* ONBOARDING TAB CONTENT */}
          {/* ======================= */}
          {activeTab === 'onboarding' && (
            <div className="flex flex-col gap-4 pt-4 flex-1">
              
              {/* Section 1: Upload */}
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Drag & Drop Materials</h3>
                </div>
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                  className={`p-10 flex flex-col items-center justify-center text-center transition-all ${isDragging ? 'bg-black/10' : ''}`}
                >
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-[#FF5458] hover:text-white hover:border-[#FF5458] transition-all mb-6"
                  >
                    <span className="text-xl leading-none">+</span> Browse Files
                  </button>
                  <p className="text-[#F9E95C] text-sm max-w-sm">
                    Upload PDFs, TXTs, or DOCs. The system will automatically parse, chunk securely, and generate semantic embeddings for AI interactions.
                  </p>
                  <input type="file" multiple accept=".txt,.pdf,.doc,.docx" className="hidden" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} />
                </div>
              </div>

              {/* Section 2: Processing Queue */}
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 flex items-center justify-center bg-white">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Processing Queue</h3>
                  {documents.length > 0 && <span className="ml-3 px-3 py-0.5 border-2 border-black text-xs font-bold text-black">{documents.length} Files</span>}
                </div>

                {documents.length === 0 ? (
                  <div className="p-10 flex flex-col items-center text-center">
                    <p className="text-[#F9E95C]">Your knowledge base is currently empty.<br/>Upload documents to begin extraction.</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-black">
                    {documents.map(doc => {
                      const uiState = statusColors[doc.status];
                      return (
                        <div key={doc.id} className="relative overflow-hidden p-4 flex items-center gap-4">
                          {doc.status !== 'ready' && doc.status !== 'error' && (
                            <div className="absolute left-0 top-0 bottom-0 bg-[#F9E95C]/10 transition-all duration-300 ease-linear pointer-events-none" style={{ width: `${doc.progress}%` }} />
                          )}
                          <div className="flex items-center gap-4 relative z-10 w-full">
                            <div className={`w-10 h-10 shrink-0 border-2 border-black flex items-center justify-center ${uiState.color}`}>
                              {uiState.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-end mb-1">
                                <h4 className="font-bold text-[#F9E95C] truncate max-w-[200px]">{doc.name}</h4>
                                <span className="text-xs text-[#F9E95C]">{doc.size}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className={`text-xs font-medium whitespace-nowrap ${uiState.color}`}>{uiState.label}</p>
                                <div className="flex items-center gap-1 flex-1 max-w-[150px]">
                                  {['uploading', 'parsing', 'chunking', 'embedding', 'ready'].map((step, idx) => {
                                    const stateOrder = ['uploading', 'parsing', 'chunking', 'embedding', 'ready'];
                                    const currentIndex = stateOrder.indexOf(doc.status);
                                    const isCompleted = currentIndex >= idx;
                                    const isCurrent = currentIndex === idx;
                                    return (
                                      <div key={step} className="flex-1 h-1.5 bg-black/20 overflow-hidden relative">
                                        {(isCompleted || isCurrent) && (
                                          <div className={`absolute inset-0 transition-transform duration-300 ${isCurrent && doc.status !== 'ready' ? 'animate-pulse bg-[#F9E95C]' : 'bg-[#F9E95C]'}`} />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <span className="text-xs font-bold text-[#F9E95C] w-8 text-right">{Math.round(doc.progress)}%</span>
                              </div>
                              
                              {doc.status === 'ready' && (
                                <div className="mt-2 flex items-center gap-2">
                                  {doc.fileUrl && (
                                    <a 
                                      href={`http://localhost:5000${doc.fileUrl}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1 border-2 border-black bg-white text-black text-xs font-bold hover:bg-[#F9E95C] transition-all"
                                    >
                                      <FileText className="w-3 h-3" />
                                      View
                                    </a>
                                  )}
                                  <button 
                                    onClick={() => deleteDocumentHandler(doc.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 border-2 border-black bg-white text-black text-xs font-bold hover:bg-[#FF5458] hover:text-white transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================= */}
          {/* INSIGHTS TAB CONTENT */}
          {/* ======================= */}
          {activeTab === 'insights' && (
            <div className="flex flex-col gap-4 pt-4 flex-1">
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Student Analytics</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <StudentInsights />
                </div>
              </div>
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Engagement Overview</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <p className="text-[#F9E95C] text-sm">Detailed engagement metrics will appear here as students interact with the AI.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-4 pt-4 flex-1">
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Exam Mode</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="flex items-center gap-8">
                    <div>
                      <h4 className="font-bold text-[#F9E95C] text-lg">Strict Socratic Mode</h4>
                      <p className="text-[#F9E95C] text-sm">AI will refuse to give direct answers and only provide hints.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const newVal = !isExamMode;
                        setIsExamMode(newVal);
                        await updateBackendSettings({ isExamMode: newVal });
                      }}
                      className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${isExamMode ? 'bg-[#FF5458]' : 'bg-black/20'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isExamMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">AI Scope Confidence</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <p className="text-[#F9E95C] text-xs mb-4">Minimum retrieval confidence required before the AI attempts an answer.</p>
                  <input 
                    type="range" min="0.1" max="0.9" step="0.05" 
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    onMouseUp={() => updateBackendSettings({ confidenceThreshold })}
                    className="w-full max-w-md h-1.5 bg-black/20 appearance-none cursor-pointer accent-[#FF5458]"
                  />
                  <div className="flex justify-between w-full max-w-md text-[10px] text-[#F9E95C] mt-2">
                    <span>High Sensitivity (0.1)</span>
                    <span className="text-[#F9E95C] font-bold text-sm">{confidenceThreshold}</span>
                    <span>Strict (0.9)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="flex flex-col gap-4 pt-4 flex-1">
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Active Classes</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x-0 divide-y-0">
                    {['1st Year (CSE)', '2nd Year (CSE)', '3rd Year (CSE)', '4th Year (CSE)', '1st Year (ECE)', '2nd Year (ECE)', '1st Year (IT)', '2nd Year (IT)', '3rd Year (IT)'].map((cls, idx, arr) => {
                      const cols = 3;
                      const isLastCol = (idx % cols) === (cols - 1);
                      const isLastRow = idx >= arr.length - (arr.length % cols || cols);
                      return (
                        <div key={cls} className={`p-6 flex flex-col items-center text-center hover:bg-black/5 transition-all border-black ${!isLastCol ? 'border-r-2' : ''} ${!isLastRow ? 'border-b-2' : ''}`}>
                          <h3 className="text-lg font-bold text-[#F9E95C] mb-1">{cls}</h3>
                          <div className="text-sm text-[#F9E95C]">
                            <span>65 Students</span> · <span>12 Materials</span>
                          </div>
                          <div className="mt-3 w-full max-w-[120px] h-1.5 bg-black/20">
                            <div className="h-full w-[85%] bg-[#F9E95C]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="border-2 border-black flex-1 flex flex-col">
                <div className="border-b-2 border-black px-5 py-2 bg-white text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">Department Summary</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <p className="text-[#F9E95C] text-sm">Cross-department analytics and enrollment data will appear here.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
