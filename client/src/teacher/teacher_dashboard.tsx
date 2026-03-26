import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle, Clock, Loader2, Database, LayoutDashboard, 
  Settings, LogOut, Search, BarChart3
} from 'lucide-react';
import StudentInsights from './student_insights';

// Simulated states for processing pipeline
type DocState = 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'ready' | 'error';
type TabState = 'onboarding' | 'insights';

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
  
  // Onboarding State
  const [documents, setDocuments] = useState<DocumentFile[]>([
    { id: '1', name: 'Advanced Physics Syllabus 2024.pdf', size: '2.4 MB', status: 'ready', progress: 100 },
    { id: '2', name: 'Lecture 3: Thermodynamics Notes.docx', size: '1.1 MB', status: 'ready', progress: 100 }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  const uploadToBackend = async (docId: string, file: File) => {
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
        formData.append('department', 'General Faculty');

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



  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newDocs: DocumentFile[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading',
      progress: 0,
    }));
    setDocuments(prev => [...newDocs, ...prev]);
    Array.from(files).forEach((f, index) => {
        uploadToBackend(newDocs[index].id, f);
    });
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
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-['Outfit']">
      
      {/* Sidebar Glassmorphism */}
      <aside className="w-64 flex flex-col justify-between py-8 px-6 border-r border-white/5 bg-white/5 backdrop-blur-2xl shadow-[0_0_40px_rgba(124,58,237,0.05)] z-20">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-red-500 flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              A
            </div>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-400">ARYNOX</h1>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'onboarding' 
                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
                : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Database className="w-5 h-5" />
              Knowledge Base
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'insights' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Student Insights
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all border border-transparent">
              <LayoutDashboard className="w-5 h-5" />
              Classes Overview
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all border border-transparent">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </div>

        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all mt-auto border border-transparent hover:border-red-500/20">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto scrollbar-hide">
        
        {/* Dynamic Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none z-0" />
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
        {activeTab === 'insights' && (
          <div className="absolute top-[200px] -left-[200px] w-[500px] h-[500px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
        )}
        
        <header className="px-10 py-8 flex justify-between items-center z-10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div>
            <h2 className="text-3xl font-semibold mb-1">
              {activeTab === 'onboarding' ? 'Faculty Hub' : 'Analytics & Insights'}
            </h2>
            <p className="text-white/40 text-sm">
              {activeTab === 'onboarding' 
                ? 'Onboard your teaching materials directly to the AI core.' 
                : 'Monitor student interactions and knowledge gaps.'}
            </p>
          </div>
          
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Search..."
              className="pl-12 pr-4 py-3 w-72 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all backdrop-blur-md"
            />
          </div>
        </header>

        <div className="px-10 pb-12 z-10 max-w-6xl w-full mx-auto">
          
          {/* ======================= */}
          {/* ONBOARDING TAB CONTENT */}
          {/* ======================= */}
          {activeTab === 'onboarding' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="mb-10">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative overflow-hidden group border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 ${isDragging ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-400/50'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 shadow-xl relative z-10 group-hover:-translate-y-2 transition-transform duration-500">
                    <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-amber-400' : 'text-violet-400'}`} />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 relative z-10">Drag & Drop Materials</h3>
                  <p className="text-white/40 max-w-md relative z-10">
                    Upload PDFs, TXTs, or DOCs. The system will automatically parse, chunk securely, and generate semantic embeddings for AI interactions.
                  </p>
                  <div className="mt-8 px-6 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/20 transition-all relative z-10"> Browse Files </div>
                  <input type="file" multiple accept=".txt,.pdf,.doc,.docx" className="hidden" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-3">
                    Processing Queue
                    {documents.length > 0 && <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70">{documents.length} Files</span>}
                  </h3>
                </div>

                {documents.length === 0 ? (
                  <div className="w-full py-16 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col items-center text-center">
                    <Database className="w-12 h-12 text-white/10 mb-4" />
                    <p className="text-white/30">Your knowledge base is currently empty.<br/>Upload documents to begin extraction.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {documents.map(doc => {
                      const uiState = statusColors[doc.status];
                      return (
                        <div key={doc.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex items-center justify-between group hover:border-white/20 transition-colors">
                          {doc.status !== 'ready' && doc.status !== 'error' && (
                            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-violet-500/10 to-amber-500/10 opacity-30 transition-all duration-300 ease-linear pointer-events-none" style={{ width: `${doc.progress}%` }} />
                          )}
                          <div className="flex items-center gap-5 relative z-10 w-full">
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border border-white/10 ${uiState.bg} ${uiState.color} shadow-lg shadow-black/20`}>
                              {uiState.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-end mb-1">
                                <h4 className="font-medium text-lg truncate max-w-[250px]">{doc.name}</h4>
                                <span className="text-xs text-white/40">{doc.size}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className={`text-sm font-medium whitespace-nowrap ${uiState.color}`}>{uiState.label}</p>
                                <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                                  {['uploading', 'parsing', 'chunking', 'embedding', 'ready'].map((step, idx) => {
                                    const stateOrder = ['uploading', 'parsing', 'chunking', 'embedding', 'ready'];
                                    const currentIndex = stateOrder.indexOf(doc.status);
                                    const isCompleted = currentIndex >= idx;
                                    const isCurrent = currentIndex === idx;
                                    return (
                                      <div key={step} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                                        {(isCompleted || isCurrent) && (
                                          <div className={`absolute inset-0 rounded-full transition-transform duration-300 ${isCurrent && doc.status !== 'ready' ? 'animate-pulse bg-amber-400' : 'bg-violet-500'}`} />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <span className="text-xs font-bold text-white/50 w-8 text-right">{Math.round(doc.progress)}%</span>
                              </div>
                              
                              {/* Inject the "View PDF" feature if Document is totally ready and has a file url assigned by backend */}
                              {doc.status === 'ready' && doc.fileUrl && (
                                <a 
                                  href={`http://localhost:5000${doc.fileUrl}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/70 hover:text-white transition-all w-fit"
                                >
                                  <FileText className="w-3 h-3" />
                                  View Source Document
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ======================= */}
          {/* INSIGHTS TAB CONTENT */}
          {/* ======================= */}
          {activeTab === 'insights' && (
            <StudentInsights />
          )}

        </div>
      </main>
    </div>
  );
}
