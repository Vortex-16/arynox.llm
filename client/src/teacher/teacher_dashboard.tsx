import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle, Clock, Loader2, Database, 
  Settings, LogOut, Search, BarChart3, Trash2, Users, TrendingUp,
  BrainCircuit, GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentInsights from './student_insights';
import { API_BASE_URL } from '../config';

// Simulated states for processing pipeline
type DocState = 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'ready' | 'error';
type TabState = 'overview' | 'documents' | 'analytics' | 'classes' | 'settings' | 'doubts' | 'subject_hub' | 'profile';

interface DocumentFile {
  id: string;
  name: string;
  size: string;
  status: DocState;
  progress: number;
  subject: string;
  module: string;
  department?: string;
  semester?: string;
  className?: string;
  fileUrl?: string;
}

export default function TeacherDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [editDoc, setEditDoc] = useState<DocumentFile | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    subject: '',
    module: '',
    department: '',
    semester: '',
    className: ''
  });

  const [activeTab, setActiveTab] = useState<TabState>('overview');

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    className: '1st Year',
    department: user?.department || 'CSE',
    semester: 'Sem 3',
    subject: '',
    chapter: '',
    section: '',
    module: ''
  });

  const [isExamMode, setIsExamMode] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);

  // Student Management State
  const [students, setStudents] = useState<any[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [isDoubtsLoading, setIsDoubtsLoading] = useState(false);
  const [resolveAnswer, setResolveAnswer] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    className: '',
    semester: ''
  });

  const [subjectStats, setSubjectStats] = useState<any>(null);
  const [selectedAnalyticsSubject, setSelectedAnalyticsSubject] = useState('');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const [profileFormData, setProfileFormData] = useState({
      name: user?.name || '',
      department: user?.department || '',
      subjects: (user?.subjects || []).join(', '),
      semesters: (user?.semesters || []).join(', '),
      className: (user?.className || '')
  });

  useEffect(() => {
    fetchDocs();
    fetchSettings();
    fetchStudents();
    fetchDoubts();
    if (activeTab === 'subject_hub') fetchSubjectAnalytics();
  }, [user, token, activeTab, selectedAnalyticsSubject]);

  useEffect(() => {
    if (!user?.id) return;
    
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    const eventSource = new EventSource(`${API_BASE_URL}/api/notifications/stream?role=teacher&teacherId=${user.id}`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'STUDENT_DOUBT') {
            if (Notification.permission === "granted") {
                new Notification("New Student Doubt!", {
                    body: `${data.studentName} is stuck on: ${data.question}`,
                    icon: "/favicon.ico"
                });
            }
            fetchDoubts();
        } else if (data.type === 'STUCK_STUDENT') {
            if (Notification.permission === "granted") {
                new Notification("URGENT: Student Stuck! 🆘", {
                    body: `A student is repeatedly struggling with: ${data.topic}`,
                    icon: "/favicon.ico"
                });
            }
        }
    };

    return () => eventSource.close();
  }, [user?.id]);

  const fetchSubjectAnalytics = async () => {
    try {
        setIsAnalyticsLoading(true);
        const params = new URLSearchParams({
            department: user?.department || '',
            subject: selectedAnalyticsSubject
        });
        const res = await fetch(`${API_BASE_URL}/api/analytics/subject-analytics?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setSubjectStats(data);
        }
    } finally {
        setIsAnalyticsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                ...profileFormData,
                subjects: profileFormData.subjects.split(',').map(s => s.trim()).filter(s => s)
            })
        });
        if (res.ok) alert("Profile updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update profile.");
    }
  };

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mappedDocs = data.map((doc: any) => ({
          id: doc._id,
          name: doc.title,
          size: 'DB', 
          status: 'ready',
          progress: 100,
          subject: doc.subject || 'General',
          module: doc.module || 'Default',
          department: doc.department || '',
          semester: doc.semester || '',
          className: doc.className || '',
          fileUrl: doc.fileUrl
        }));
        setDocuments(mappedDocs);
      }
    } catch (error) {
      console.error("Failed to load textbooks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!user?.department) return;
    try {
      setIsStudentsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/users/students?department=${user.department}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
        console.error("Failed to load students", err);
    } finally {
        setIsStudentsLoading(false);
    }
  };

  const fetchDoubts = async () => {
    try {
        setIsDoubtsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/doubts/faculty`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setDoubts(data);
        }
    } catch (err) {
        console.error("Failed to fetch doubts", err);
    } finally {
        setIsDoubtsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings?department=${user?.department || 'CSE'}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsExamMode(data.isExamMode);
        setConfidenceThreshold(data.confidenceThreshold);
      }
    } catch (err) {}
  };

  const updateBackendSettings = async (updates: any) => {
    try {
        await fetch(`${API_BASE_URL}/api/settings/update`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                department: user?.department || 'CSE',
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

    try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', file.name);
        formData.append('department', meta.department);
        formData.append('className', meta.className);
        formData.append('semester', meta.semester);
        formData.append('subject', meta.subject);
        formData.append('chapter', meta.chapter);
        formData.append('section', meta.section);
        formData.append('module', meta.module);

        const apiResponse = await fetch(`${API_BASE_URL}/api/documents/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await apiResponse.json();
        if (!apiResponse.ok) throw new Error(data.error || 'Upload failed');

        keepAnimating = false;
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, status: 'ready', progress: 100, fileUrl: data.documentMeta?.fileUrl } : doc
        ));

    } catch (error) {
        console.error("API Upload failed", error);
        keepAnimating = false;
        setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, status: 'error' } : doc));
    }
  };

  const deleteDocumentHandler = async (docId: string) => {
    if (!window.confirm("Delete this document?")) return;
    setDocuments(prev => prev.filter(d => d.id !== docId));
    try {
      await fetch(`${API_BASE_URL}/api/documents/${docId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      fetchDocs();
    }
  };

  const handleUpdateDocument = async (docId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchDocs();
        setEditDoc(null);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleUpdateStudent = async (studentId: string, updates: any) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/students/${studentId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(updates)
        });
        if (res.ok) {
            fetchStudents();
            setEditStudent(null);
        }
    } catch (err) {
        console.error("Update student failed", err);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm("Remove this student? This will delete their account.")) return;
    try {
        await fetch(`${API_BASE_URL}/api/users/students/${studentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchStudents();
    } catch (err) {
        console.error("Delete student failed", err);
    }
  };

  const handleResolveDoubt = async (id: string) => {
    if (!resolveAnswer) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/doubts/${id}/resolve`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ answer: resolveAnswer })
        });
        if (res.ok) {
            fetchDoubts();
            setResolvingId(null);
            setResolveAnswer('');
        }
    } catch (err) {
        console.error("Resolve failed", err);
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
      subject: uploadMetadata.subject || 'General',
      module: uploadMetadata.module || 'Default'
    }));
    
    setDocuments(prev => [...newDocs, ...prev]);
    pendingFiles.forEach((f, idx) => {
        uploadToBackend(newDocs[idx].id, f, uploadMetadata);
    });
    setPendingFiles([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusColors: Record<DocState, { color: string, bg: string, label: string, icon: React.ReactNode }> = {
    uploading: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Uploading...', icon: <Loader2 className="animate-spin w-5 h-5" /> },
    parsing: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Parsing...', icon: <FileText className="animate-pulse w-5 h-5" /> },
    chunking: { color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Chunking...', icon: <Database className="animate-pulse w-5 h-5" /> },
    embedding: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Embedding...', icon: <Loader2 className="animate-spin w-5 h-5" /> },
    ready: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Ready', icon: <CheckCircle className="w-5 h-5" /> },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Error', icon: <Clock className="w-5 h-5" /> }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-[#131314] text-white overflow-hidden font-['Outfit'] mesh-gradient">
      
      {showMetadataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-[500px]">
            <h3 className="text-xl font-bold mb-4">Document Metadata</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Department</label>
                  <input readOnly value={uploadMetadata.department} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Semester</label>
                  <select
                    value={uploadMetadata.semester}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, semester: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none [&>option]:bg-[#111]"
                  >
                    {['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Subject Name *</label>
                  <input 
                    type="text" placeholder="e.g. Graph Theory" value={uploadMetadata.subject}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, subject: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Module</label>
                  <input 
                    type="text" placeholder="e.g. Module 1" value={uploadMetadata.module}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, module: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => {setShowMetadataModal(false); setPendingFiles([]);}} className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium">Cancel</button>
              <button onClick={confirmUpload} className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium">Upload</button>
            </div>
          </div>
        </div>
      )}
      
      <aside className="w-64 flex flex-col justify-between py-8 px-6 border-r border-white/5 bg-[#1e1f20]/50 backdrop-blur-2xl z-20">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-red-500 flex items-center justify-center font-bold text-xl shadow-lg">A</div>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-400">ARYNOX</h1>
          </div>

          <nav className="flex flex-col gap-2">
            {[
              { id: 'documents', icon: Database, label: 'Knowledge Base', color: 'violet' },
              { id: 'doubts', icon: BrainCircuit, label: 'Student Doubts', color: 'amber' },
              { id: 'subject_hub', icon: BarChart3, label: 'Confusion Matrix', color: 'emerald' },
              { id: 'analytics', icon: BarChart3, label: 'Student Insights', color: 'blue' },
              { id: 'classes', icon: Users, label: 'Classes Overview', color: 'violet' },
              { id: 'profile', icon: GraduationCap, label: 'Personal Profile', color: 'indigo' },
              { id: 'settings', icon: Settings, label: 'AI Controls', color: 'red' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabState)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id 
                  ? `bg-${tab.color}-500/10 text-${tab.color}-400 border border-${tab.color}-500/20` 
                  : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 flex flex-col bg-[#131314] overflow-y-auto">
        <header className="px-10 py-8 flex justify-between items-center z-40 sticky top-0 glass-header">
          <div>
            <h2 className="text-3xl font-semibold mb-1">
              {activeTab === 'documents' ? 'Knowledge Base' : activeTab === 'analytics' ? 'Analytics' : activeTab === 'classes' ? 'Classes' : activeTab === 'profile' ? 'Personal Profile' : 'Settings'}
            </h2>
            <p className="text-white/40 text-sm">{user.name} • Faculty of {user.department}</p>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Search..." className="pl-12 pr-4 py-3 w-72 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-violet-500/50 transition-all" />
          </div>
        </header>

        <div className="px-10 pb-12 max-w-6xl w-full mx-auto">
          {activeTab === 'documents' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-10 border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? 'border-amber-400 bg-amber-400/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}
              >
                <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-amber-400' : 'text-violet-400'}`} />
                <h3 className="text-2xl font-semibold mb-2">Upload Academic Materials</h3>
                <p className="text-white/40">PDF, TXT, DOCX. Vectors will be generated for {user.department} specifically.</p>
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} />
              </section>

              <section>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Course Materials Repository</h3>
                    <div className="text-xs text-white/30 uppercase tracking-widest">{documents.length} Total Units</div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /></div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-white/5 text-white/20 font-medium">No documents indexed in your department yet.</div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(
                        documents.reduce((acc, doc) => {
                            const sub = doc.subject || 'Uncategorized';
                            if (!acc[sub]) acc[sub] = {};
                            const mod = doc.module || 'General';
                            if (!acc[sub][mod]) acc[sub][mod] = [];
                            acc[sub][mod].push(doc);
                            return acc;
                        }, {} as Record<string, Record<string, DocumentFile[]>>)
                    ).map(([subject, modules]) => (
                        <div key={subject} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                            <h4 className="text-violet-400 font-bold uppercase tracking-wider text-sm mb-4 border-b border-violet-500/10 pb-2 flex items-center gap-2">
                                <Database className="w-4 h-4" /> {subject}
                            </h4>
                            <div className="space-y-6">
                                {Object.entries(modules).map(([module, docs]) => (
                                    <div key={module} className="pl-4 border-l border-white/10">
                                        <h5 className="text-white/60 font-semibold text-sm mb-3 flex items-center gap-2 italic">
                                            <TrendingUp className="w-3 h-3" /> {module}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-3">
                                            {docs.map(doc => {
                                                const uiStatus = statusColors[doc.status];
                                                return (
                                                    <div key={doc.id} className="p-4 rounded-xl border border-white/5 bg-[#1a1b1c] flex items-center justify-between group hover:border-violet-500/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uiStatus.bg} ${uiStatus.color}`}>{uiStatus.icon}</div>
                                                            <div>
                                                                <h4 className="font-medium text-sm text-white/90">{doc.name}</h4>
                                                                <p className={`text-[10px] ${uiStatus.color}`}>{uiStatus.label} • {doc.progress}%</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {doc.status === 'ready' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditDoc(doc);
                                                                            setEditFormData({
                                                                                title: doc.name,
                                                                                subject: doc.subject,
                                                                                module: doc.module,
                                                                                department: doc.department || user.department || '',
                                                                                semester: doc.semester || '',
                                                                                className: doc.className || ''
                                                                            });
                                                                        }}
                                                                        className="p-2 text-white/30 hover:text-white transition-all"
                                                                        title="Edit Metadata"
                                                                    >
                                                                        <Settings className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => deleteDocumentHandler(doc.id)} 
                                                                        className="p-2 text-white/30 hover:text-red-400 transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'analytics' && <StudentInsights />}

          {activeTab === 'settings' && (
             <section className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl">
                <h3 className="text-xl font-bold mb-6">Pedagogical Settings</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <div>
                      <h4 className="font-semibold">Socratic Mode</h4>
                      <p className="text-sm text-white/40">Force AI to only provide hints during exams.</p>
                    </div>
                    <button onClick={() => { setIsExamMode(!isExamMode); updateBackendSettings({isExamMode: !isExamMode}); }} className={`w-12 h-6 rounded-full relative transition-all ${isExamMode ? 'bg-amber-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isExamMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">AI Strictness (Confidence Threshold)</h4>
                        <p className="text-sm text-white/40">Higher values require exact content matches for replies.</p>
                      </div>
                      <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg font-bold text-xs uppercase tracking-widest">
                        {(confidenceThreshold * 100).toFixed(0)}%
                      </div>
                    </div>
                    <input 
                      type="range" min="0.1" max="0.9" step="0.05"
                      value={confidenceThreshold}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setConfidenceThreshold(val);
                        updateBackendSettings({ confidenceThreshold: val });
                      }}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[9px] text-white/20 font-black uppercase tracking-widest">
                      <span>Lenient</span>
                      <span>Target (45%)</span>
                      <span>Strict</span>
                    </div>
                  </div>
                </div>
             </section>
          )}

            {activeTab === 'profile' && (
               <section className="bg-[#0b0b0b] border border-white/5 rounded-[40px] p-10 max-w-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-[100px]" />
                   <div className="relative z-10 space-y-8">
                       <div>
                           <h3 className="text-2xl font-black text-white italic">FACULTY IDENTITY</h3>
                           <p className="text-xs text-indigo-400/60 font-black uppercase tracking-widest">Maintain your academic domain</p>
                       </div>

                       <div className="space-y-6">
                           <div className="space-y-4">
                               <div>
                                   <label className="block text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.2em]">Display Name</label>
                                   <input 
                                       type="text" value={profileFormData.name}
                                       onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                                   />
                               </div>
                               <div>
                                   <label className="block text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.2em]">Institution / Department</label>
                                   <input 
                                       type="text" value={profileFormData.department}
                                       onChange={(e) => setProfileFormData({...profileFormData, department: e.target.value})}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                                   />
                               </div>
                               <div>
                                   <label className="block text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.2em]">Subject Expertise (comma separated)</label>
                                   <textarea 
                                       value={profileFormData.subjects}
                                       onChange={(e) => setProfileFormData({...profileFormData, subjects: e.target.value})}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-indigo-500 transition-all font-medium h-24"
                                       placeholder="e.g. Thermodynamics, Fluid Mechanics, Heat Transfer"
                                   />
                               </div>
                           </div>

                           <button 
                               onClick={handleUpdateProfile}
                               className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(79,70,229,0.2)]"
                           >
                               Save Profile Changes
                           </button>
                       </div>
                   </div>
               </section>
            )}

          {activeTab === 'classes' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-400" />
                        My Department Students
                    </h3>
                    <div className="text-xs text-white/30 uppercase tracking-widest">{students.length} Registered</div>
                </div>

                {isStudentsLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
                ) : students.length === 0 ? (
                    <div className="p-16 rounded-[40px] border border-dashed border-white/5 bg-white/[0.01] text-center">
                        <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <h4 className="text-white/40 font-medium">No students registered in {user.department} yet.</h4>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map(s => (
                            <div key={s._id} className="p-6 rounded-[32px] bg-[#1a1b1c] border border-white/5 group hover:border-blue-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 flex items-center justify-center font-black text-blue-400 text-lg">
                                        {s.name[0]}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                setEditStudent(s);
                                                setStudentFormData({
                                                    name: s.name,
                                                    className: s.className || '',
                                                    semester: s.semester || ''
                                                });
                                            }}
                                            className="p-2 text-white/30 hover:text-blue-400 transition-all"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteStudent(s._id)}
                                            className="p-2 text-white/30 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-white/90 mb-1">{s.name}</h4>
                                <p className="text-xs text-white/30 mb-4">{s.email}</p>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/40 font-bold uppercase tracking-wider">{s.className || 'No Class'}</div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/40 font-bold uppercase tracking-wider">{s.semester || 'No Sem'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'subject_hub' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-emerald-400" />
                            Academic Confusion Matrix
                        </h3>
                        <p className="text-sm text-white/40 mt-1">Identify curriculum bottlenecks and subject-specific learning gaps in {user.department}.</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <select 
                            value={selectedAnalyticsSubject}
                            onChange={(e) => setSelectedAnalyticsSubject(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white/60 outline-none hover:border-emerald-500/50 transition-all [&>option]:bg-[#131314]"
                        >
                            <option value="">All My Subjects</option>
                            {Array.from(new Set(documents.filter(d => d.subject).map(d => d.subject))).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isAnalyticsLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Heatmap Section */}
                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                            <h4 className="text-sm font-black text-emerald-500/80 uppercase tracking-[0.2em] mb-8">Concept Heatmap</h4>
                            
                            <div className="space-y-5">
                                {subjectStats?.topicHeatmap?.map((item: any, i: number) => (
                                    <div key={i} className="group/row cursor-default">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-bold text-white/80 group-hover/row:text-white transition-colors capitalize">{item.topic}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-red-400/80">{(item.confusionRate || 0)}% Confusion</span>
                                                <span className="text-[10px] font-black text-white/20">•</span>
                                                <span className="text-[10px] font-black text-white/30">{item.total} Queries</span>
                                            </div>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden flex">
                                            <div 
                                                className="h-full bg-emerald-500/40 rounded-l-full transition-all duration-1000"
                                                style={{ width: `${100 - (parseFloat(item.confusionRate) || 0)}%` }}
                                            />
                                            <div 
                                                className="h-full bg-red-500/60 rounded-r-full transition-all duration-1000 animate-pulse"
                                                style={{ width: `${(item.confusionRate || 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!subjectStats?.topicHeatmap || subjectStats.topicHeatmap.length === 0) && (
                                    <div className="py-20 text-center opacity-20">No query data available for this selection.</div>
                                )}
                            </div>
                        </div>

                        {/* Module Distribution */}
                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 backdrop-blur-sm group">
                            <h4 className="text-sm font-black text-blue-400/80 uppercase tracking-[0.2em] mb-8">Module distribution</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {subjectStats?.moduleStats?.map((m: any, i: number) => (
                                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all flex flex-col justify-between aspect-square">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-white">{m.count}</p>
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">{m.module}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!subjectStats?.moduleStats || subjectStats.moduleStats.length === 0) && (
                                    <div className="col-span-2 py-20 text-center opacity-20 italic">No module metrics categorized yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          )}

          {activeTab === 'doubts' && (
            <div className="space-y-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <BrainCircuit className="w-6 h-6 text-amber-500" />
                        Pending Student Queries
                    </h3>
                    <div className="text-xs text-white/30 uppercase tracking-widest">{doubts.filter(d => d.status === 'pending').length} Unresolved</div>
                </div>

                {isDoubtsLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>
                ) : doubts.length === 0 ? (
                    <div className="p-16 rounded-[40px] border border-dashed border-white/5 bg-white/[0.01] text-center">
                        <BrainCircuit className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <h4 className="text-white/40 font-medium">No student doubts for your subjects yet.</h4>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {doubts.map(d => (
                            <div key={d._id} className={`p-6 rounded-[32px] bg-[#1a1b1c] border transition-all ${d.status === 'resolved' ? 'border-emerald-500/20 opacity-60' : 'border-white/5 hover:border-amber-500/30'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 flex items-center justify-center font-bold text-amber-400">
                                            {d.studentName[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white/90">{d.studentName}</h4>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{d.subject} • {d.module || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${d.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {d.status}
                                    </div>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed mb-6 italic underline-offset-8 decoration-white/10 decoration-dashed">"{d.question}"</p>
                                
                                {d.status === 'pending' ? (
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        {resolvingId === d._id ? (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <textarea 
                                                    value={resolveAnswer}
                                                    onChange={(e) => setResolveAnswer(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-amber-500 outline-none min-h-[100px]"
                                                    placeholder="Enter your expert answer..."
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleResolveDoubt(d._id)} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs font-bold transition-all">Submit Answer</button>
                                                    <button onClick={() => setResolvingId(null)} className="px-6 py-2 hover:bg-white/5 text-white/40 rounded-full text-xs transition-all">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setResolvingId(d._id)} className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
                                                <FileText className="w-4 h-4" /> Provide Answer
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">Resolved Response</div>
                                        <p className="text-sm text-white/40">{d.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="bg-[#1a1b1c] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-gradient-to-br from-violet-500/10 to-transparent">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Settings className="w-6 h-6 text-violet-500" />
                  Edit Material Data
                </h3>
                <p className="text-sm text-white/40 mt-1">Update indexing parameters for this unit.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Document Title</label>
                    <input 
                      type="text" value={editFormData.title}
                      onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-violet-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Subject</label>
                          <input 
                              type="text" value={editFormData.subject}
                              onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-violet-500 outline-none transition-all"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Department</label>
                          <select 
                              value={(editFormData as any).department}
                              onChange={(e) => setEditFormData({...editFormData, department: e.target.value} as any)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-violet-500 outline-none transition-all [&>option]:bg-[#1a1b1c]"
                          >
                              {['CSE', 'IT', 'ECE', 'MECH'].map(d => (
                                  <option key={d} value={d}>{d}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Module</label>
                          <input 
                              type="text" value={editFormData.module}
                              onChange={(e) => setEditFormData({...editFormData, module: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-violet-500 outline-none transition-all"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Semester</label>
                          <select 
                              value={editFormData.semester}
                              onChange={(e) => setEditFormData({...editFormData, semester: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-violet-500 outline-none transition-all [&>option]:bg-[#1a1b1c]"
                          >
                              <option value="">Select Sem</option>
                              {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Class / Year (e.g. 2nd Year)</label>
                          <input 
                              type="text" value={editFormData.className}
                              onChange={(e) => setEditFormData({...editFormData, className: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-violet-500 outline-none transition-all"
                              placeholder="e.g. 2nd Year"
                          />
                      </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
                <button 
                  onClick={() => setEditDoc(null)}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/5 transition-all text-white/70"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpdateDocument(editDoc.id, editFormData)}
                  className="px-8 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] text-white"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {editStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="bg-[#1a1b1c] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-500" />
                  Edit Student Profile
                </h3>
                <p className="text-sm text-white/40 mt-1">Manage academic metadata for {editStudent.email}.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" value={studentFormData.name}
                      onChange={(e) => setStudentFormData({...studentFormData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Class / Year</label>
                          <select 
                              value={studentFormData.className}
                              onChange={(e) => setStudentFormData({...studentFormData, className: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all [&>option]:bg-[#1a1b1c]"
                          >
                              <option value="">Select Class</option>
                              {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Semester</label>
                          <select 
                              value={studentFormData.semester}
                              onChange={(e) => setStudentFormData({...studentFormData, semester: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all [&>option]:bg-[#1a1b1c]"
                          >
                              <option value="">Select Sem</option>
                              {['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
                <button onClick={() => setEditStudent(null)} className="px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/5 transition-all text-white/70">Cancel</button>
                <button onClick={() => handleUpdateStudent(editStudent._id, studentFormData)} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white">Update Profile</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
