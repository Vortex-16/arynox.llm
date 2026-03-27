import { BarChart3, Users, Network, TrendingUp, Search, Database, Loader2, Download, BookOpen, X, AlertTriangle, MessageCircle, Send, CheckCircle2, Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface StuckStudent {
  studentId: string;
  anonymizedName: string;
  topic: string;
  repeatCount: number;
  lastAsked: string;
  sessionId: string | null;
  queries: {
    query: string;
    response: string;
    timestamp: string;
    status: string;
    sessionId: string;
  }[];
}

export default function StudentInsights() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  // Stuck Students State
  const [stuckStudents, setStuckStudents] = useState<StuckStudent[]>([]);
  const [selectedStuck, setSelectedStuck] = useState<StuckStudent | null>(null);
  const [teacherMessage, setTeacherMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  const fetchStuckStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/stuck-students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStuckStudents(await res.json());
    } catch (err) {
      console.error("Failed to refresh stuck students", err);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [resAnalytics, resStudents] = await Promise.all([
            fetch('http://localhost:5000/api/analytics/insights', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:5000/api/analytics/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
        if (resStudents.ok) setStudents(await resStudents.json());
        await fetchStuckStudents();
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();

    // ─── REAL-TIME NOTIFICATIONS (SSE) ──────────────────────────────────────
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    const eventSource = new EventSource('http://localhost:5000/api/notifications/stream?role=teacher');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("[SSE] Event received:", data);

        if (data.type === 'STUCK_STUDENT') {
            // 1. Show native browser notification
            if (Notification.permission === "granted") {
                new Notification("Student Needs Help! 🚨", {
                    body: `Student #${data.studentId.slice(-4).toUpperCase()} is stuck on "${data.topic}".`,
                    icon: "/favicon.ico" // assuming one exists
                });
            }
            
            // 2. Refresh the stuck students list immediately
            fetchStuckStudents();
        }
    };

    eventSource.onerror = (err) => {
        console.error("[SSE] Connection error:", err);
        eventSource.close();
    };

    return () => {
        eventSource.close();
    };
  }, []);

  const handleTeacherRespond = async () => {
    if (!selectedStuck || !teacherMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch('http://localhost:5000/api/analytics/teacher-respond', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStuck.studentId,
          sessionId: selectedStuck.queries?.[0]?.sessionId || selectedStuck.sessionId,
          message: teacherMessage
        })
      });
      if (res.ok) {
        const key = `${selectedStuck.studentId}_${selectedStuck.topic}`;
        setRespondedIds(prev => new Set(prev).add(key));
        setTeacherMessage('');
      }
    } catch (err) {
      console.error("Failed to send teacher response:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:text-amber-400 transition-all"><BarChart3 className="w-16 h-16"/></div>
          <h3 className="text-white/40 text-sm font-medium mb-2">Total Student Queries</h3>
          <div className="text-4xl font-bold mb-2">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-amber-500" /> : (analytics?.totalQueries || 0)}
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium"><TrendingUp className="w-4 h-4"/> Real-time indexing active</div>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:text-violet-400 transition-all"><Users className="w-16 h-16"/></div>
          <h3 className="text-white/40 text-sm font-medium mb-2">Total Students Interacted</h3>
          <div className="text-4xl font-bold mb-2">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-violet-500" /> : (analytics?.studentActivity || 0)}
          </div>
          <div className="text-white/30 text-sm">Unique students reached</div>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:text-red-400 transition-all"><Network className="w-16 h-16"/></div>
          <h3 className="text-white/40 text-sm font-medium mb-2">Knowledge Hit Rate</h3>
          <div className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-violet-400">92.4%</div>
          <div className="text-white/30 text-sm">High-fidelity RAG focus</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STUDENT NEEDS HELP — Prominent alert section */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-red-500/[0.06] to-amber-500/[0.03] border border-red-500/20 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            Student Needs Help
            {stuckStudents.length > 0 && (
              <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold animate-pulse">
                {stuckStudents.length} Alert{stuckStudents.length > 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>
        <p className="text-sm text-white/40 mb-6 max-w-2xl relative z-10">
          Students listed below have been repeatedly asking the same doubt. The AI tutor may not be explaining it effectively — your direct intervention can help.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-red-400/50" /></div>
        ) : stuckStudents.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-3" />
            <p className="text-white/30 text-sm">All students are progressing well. No repeated doubts detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {stuckStudents.map((stuck, idx) => {
              const key = `${stuck.studentId}_${stuck.topic}`;
              const hasResponded = respondedIds.has(key);
              return (
                <div key={idx} className={`p-5 rounded-2xl border flex flex-col gap-4 group transition-all ${
                  hasResponded 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-white/5 border-red-500/10 hover:border-red-500/30'
                }`}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">
                          {stuck.anonymizedName}
                        </span>
                        {hasResponded && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Responded
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30">
                        {new Date(stuck.lastAsked).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-white/90 text-sm mb-1 leading-snug">
                      "{stuck.queries?.[0]?.query || 'Unknown query'}"
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-tight">{stuck.topic}</span>
                      <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">
                        Asked {stuck.repeatCount}x
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedStuck(stuck); setTeacherMessage(''); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    View Details & Respond
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Visual Chart: Recent Queries (Replaced Bar Chart) */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col h-[400px]">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            Live Student Queries Stream
          </h3>
          
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto scrollbar-hide pr-2">
            {isLoading ? (
               <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>
            ) : analytics?.recentLogs?.length === 0 ? (
               <div className="text-white/50 text-sm">No queries logged yet.</div>
            ) : (
              analytics?.recentLogs?.map((log: any, i: number) => (
                <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white-[0.07] transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-md">
                                {log.studentId || 'Anonymous'}
                            </span>
                            <span className="text-white/30 text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-white/90 text-[14px] font-medium leading-snug">{log.query}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className={`text-[10px] font-bold uppercase tracking-tight w-fit px-2 py-0.5 rounded ${log.status === 'OUT_OF_SCOPE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {log.status === 'OUT_OF_SCOPE' ? 'Outside Scope' : 'Academic'}
                    </div>
                    {log.topic && <div className="text-[10px] font-bold uppercase tracking-tight text-white/40 bg-white/10 px-2 py-0.5 rounded">{log.topic}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Topic Modeling Clusters */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
            <Database className="w-5 h-5 text-violet-400" />
            Live Topic Distrubution
          </h3>

          <div className="text-sm text-white/50 mb-6">
            Real-time clustering of student queries based on AI-extracted topics.
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
             {isLoading ? (
                <div className="col-span-2 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-white/20" /></div>
             ) : (analytics?.topicClusters?.length || 0) === 0 ? (
                <div className="col-span-2 text-white/30 text-center py-12">No topics clustered yet.</div>
             ) : (
                analytics?.topicClusters.map((cluster: any, idx: number) => (
                    <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between ${
                        idx % 3 === 0 ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/20' :
                        idx % 3 === 1 ? 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 border-violet-500/20' :
                        'bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20'
                    }`}>
                      <div className={`font-semibold mb-1 ${
                         idx % 3 === 0 ? 'text-amber-300' : idx % 3 === 1 ? 'text-violet-300' : 'text-blue-300'
                      }`}>{cluster.topic}</div>
                      <div className="text-xs text-white/50 mb-4">{cluster.count} queries in total.</div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className={`text-2xl font-bold ${
                           idx % 3 === 0 ? 'text-amber-400' : idx % 3 === 1 ? 'text-violet-400' : 'text-blue-400'
                        }`}>{cluster.percentage}%</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] ${cluster.health === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {cluster.health}
                        </div>
                      </div>
                    </div>
                ))
             )}
          </div>
        </div>

      </div>

      {/* Academic Reports Section */}
      <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col mt-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Academic Reports
          </h3>
          <button 
            onClick={() => setShowStudentsModal(true)}
            className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-medium transition-all text-white/70 hover:text-white cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="text-sm text-white/50 mb-6 max-w-2xl">
          Detailed AI-generated academic evaluations for your students based on their interactive learning patterns, questions, and mastery indicators.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.slice(0, 3).map((student, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-white/90">{student.anonymizedName}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] ${student.health === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {student.health}
                            </span>
                        </div>
                        <p className="text-xs text-white/40 mb-4">{student.queryCount} total queries asked.</p>
                        <div className="flex flex-wrap gap-1 mb-6">
                            {(student.topics || []).slice(0, 3).map((t: string, tIdx: number) => (
                                <span key={tIdx} className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/50">{t}</span>
                            ))}
                        </div>
                    </div>
                    <a 
                        href={`http://localhost:5000/api/analytics/students/${student.id}/report`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-sm font-medium transition-all group-hover:text-violet-300 pointer-events-auto cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </a>
                </div>
            ))}
            {students.length === 0 && !isLoading && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-white/30 text-center py-6">No academic records found.</div>
            )}
        </div>
      </div>

      {/* View All Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowStudentsModal(false)}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-all bg-white/5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-2">All Academic Records</h3>
            <p className="text-white/50 text-sm mb-6">Complete list of registered students and their academic insights.</p>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map((student, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-white/90">{student.anonymizedName}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] ${student.health === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {student.health}
                              </span>
                          </div>
                          <p className="text-xs text-white/40 mb-4">{student.queryCount} queries across {(student.topics || []).length} unique topics.</p>
                          <div className="flex flex-wrap gap-1 mb-6">
                            {(student.topics || []).slice(0, 5).map((t: string, tIdx: number) => (
                                <span key={tIdx} className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-white/50 truncate block max-w-[120px]">{t}</span>
                            ))}
                          </div>
                          <div className="flex justify-end mt-auto">
                              <a 
                                  href={`http://localhost:5000/api/analytics/students/${student.id}/report`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all"
                              >
                                  <Download className="w-3.5 h-3.5" />
                                  Detailed AI Report
                              </a>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STUCK STUDENT DETAIL MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedStuck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setSelectedStuck(null)}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-all bg-white/5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Student Needs Help</h3>
                <p className="text-white/40 text-sm">{selectedStuck.anonymizedName} — Stuck on "{selectedStuck.topic}"</p>
              </div>
            </div>

            {/* Meta badges */}
            <div className="flex items-center gap-2 mb-6 mt-3">
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold uppercase">
                Asked {selectedStuck.repeatCount} times
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase">
                {selectedStuck.topic}
              </span>
              <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded">
                Last: {new Date(selectedStuck.lastAsked).toLocaleString()}
              </span>
            </div>

            {/* Scrollable Query History */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4 mb-6">
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">Conversation History</h4>
              {selectedStuck.queries.map((q, idx) => (
                <div key={idx} className="rounded-2xl border border-white/5 overflow-hidden">
                  {/* Student Question */}
                  <div className="p-4 bg-red-500/[0.04] border-b border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[10px] font-bold text-red-400 uppercase">Student Query</span>
                      <span className="text-[10px] text-white/30 ml-auto">
                        {new Date(q.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">{q.query}</p>
                  </div>
                  {/* AI Response */}
                  <div className="p-4 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[10px] font-bold text-violet-400 uppercase">AI Tutor Response</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${
                        q.status === 'ANSWERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>{q.status}</span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">{q.response}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Teacher Response Input */}
            <div className="border-t border-white/10 pt-5">
              {respondedIds.has(`${selectedStuck.studentId}_${selectedStuck.topic}`) ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Response Sent Successfully</p>
                    <p className="text-xs text-white/40">Your answer has been injected into the student's chat session. They will see it the next time they open their conversation.</p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                    Write your response to the student
                  </label>
                  <div className="flex gap-3">
                    <textarea
                      value={teacherMessage}
                      onChange={(e) => setTeacherMessage(e.target.value)}
                      placeholder="Explain the concept clearly to help the student understand..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500/50 resize-none h-20 placeholder:text-white/20"
                    />
                    <button
                      onClick={handleTeacherRespond}
                      disabled={isSending || !teacherMessage.trim()}
                      className="px-5 rounded-xl bg-red-500 hover:bg-red-400 disabled:bg-red-500/30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25 mt-2">
                    Your response will appear as a [Teacher Response] message in the student's chat session.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
