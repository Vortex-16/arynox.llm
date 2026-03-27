import { BarChart3, Users, Network, TrendingUp, Search, Database, Loader2, Download, BookOpen, X, AlertTriangle, MessageCircle, Send, CheckCircle2, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

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
      const res = await fetch('http://localhost:5000/api/analytics/stuck-students');
      if (res.ok) setStuckStudents(await res.json());
    } catch (err) {
      console.error("Failed to refresh stuck students", err);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [resAnalytics, resStudents] = await Promise.all([
            fetch('http://localhost:5000/api/analytics/insights'),
            fetch('http://localhost:5000/api/analytics/students')
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

    eventSource.onerror = () => {
        // EventSource auto-reconnects — don't close() or it disables reconnect
        console.warn('[SSE] Connection error. EventSource will auto-reconnect...');
    };

    return () => {
        eventSource.close();
    };
  }, []);

  const handleResolveDoubt = async (student: { studentId: string; topic: string }) => {
    try {
      await fetch('http://localhost:5000/api/analytics/resolve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.studentId, topic: student.topic })
      });
      // Immediately remove from UI
      setStuckStudents(prev => prev.filter(s => !(s.studentId === student.studentId && s.topic === student.topic)));
      if (selectedStuck?.studentId === student.studentId && selectedStuck?.topic === student.topic) {
        setSelectedStuck(null);
      }
    } catch (err) {
      console.error('Failed to resolve doubt:', err);
    }
  };

  const handleTeacherRespond = async () => {
    if (!selectedStuck || !teacherMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch('http://localhost:5000/api/analytics/teacher-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStuck.studentId,
          sessionId: selectedStuck.queries?.[0]?.sessionId || selectedStuck.sessionId,
          message: teacherMessage
        })
      });
      if (res.ok) {
        // Mark the doubt as resolved — removes card from teacher's list
        await handleResolveDoubt({ studentId: selectedStuck.studentId, topic: selectedStuck.topic });
        setTeacherMessage('');
        setRespondedIds(prev => new Set(prev).add(`${selectedStuck.studentId}_${selectedStuck.topic}`));
      }
    } catch (err) {
      console.error("Failed to send teacher response:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top KPIs */}
      <div className="grid grid-cols-3 border-2 border-black">
        <div className="p-5 border-r-2 border-black text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#F9E95C]"/>
            <h3 className="text-[#F9E95C] text-xs font-bold uppercase tracking-wider">Total Queries</h3>
          </div>
          <div className="text-3xl font-bold text-[#F9E95C]">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#F9E95C] mx-auto" /> : (analytics?.totalQueries || 0)}
          </div>
          <div className="flex items-center justify-center gap-1 text-[#F9E95C] text-xs mt-1"><TrendingUp className="w-3 h-3"/> Active</div>
        </div>
        <div className="p-5 border-r-2 border-black text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#F9E95C]"/>
            <h3 className="text-[#F9E95C] text-xs font-bold uppercase tracking-wider">Students</h3>
          </div>
          <div className="text-3xl font-bold text-[#F9E95C]">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#F9E95C] mx-auto" /> : (analytics?.studentActivity || 0)}
          </div>
          <div className="text-[#F9E95C] text-xs mt-1">Unique interacted</div>
        </div>
        <div className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Network className="w-4 h-4 text-[#F9E95C]"/>
            <h3 className="text-[#F9E95C] text-xs font-bold uppercase tracking-wider">Hit Rate</h3>
          </div>
          <div className="text-3xl font-bold text-[#F9E95C]">92.4%</div>
          <div className="text-[#F9E95C] text-xs mt-1">RAG accuracy</div>
        </div>
      </div>

      {/* Student Needs Help */}
      <div className="border-2 border-black">
        <div className="border-b-2 border-black px-5 py-2 bg-white flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF5458]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">Student Needs Help</h3>
          {stuckStudents.length > 0 && (
            <span className="px-2 py-0.5 border-2 border-black text-xs font-bold text-[#FF5458] ml-2">
              {stuckStudents.length} Alert{stuckStudents.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#F9E95C]/50" /></div>
        ) : stuckStudents.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#F9E95C]/30 mx-auto mb-2" />
            <p className="text-[#F9E95C] text-sm">All students progressing well.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {stuckStudents.map((stuck, idx) => {
              const key = `${stuck.studentId}_${stuck.topic}`;
              const hasResponded = respondedIds.has(key);
              return (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#F9E95C]">{stuck.anonymizedName}</span>
                      {hasResponded && (
                        <span className="text-[10px] uppercase font-bold text-[#20B2AA] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Responded
                        </span>
                      )}
                      <span className="text-[10px] text-[#F9E95C] ml-auto">{new Date(stuck.lastAsked).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[#F9E95C]/80 text-sm mb-1">"{stuck.queries?.[0]?.query || 'Unknown query'}"</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#F9E95C] border border-[#F9E95C] px-2 py-0.5">{stuck.topic}</span>
                      <span className="text-[10px] font-bold text-[#FF5458]">Asked {stuck.repeatCount}x</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedStuck(stuck); setTeacherMessage(''); }}
                    className="px-4 py-2 border-2 border-black bg-white text-black text-xs font-bold uppercase hover:bg-[#FF5458] hover:text-white hover:border-[#FF5458] transition-all shrink-0 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Live Queries Stream */}
        <div className="border-2 border-black flex flex-col" style={{maxHeight: '350px'}}>
          <div className="border-b-2 border-black px-5 py-2 bg-white text-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Live Queries Stream
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y-2 divide-black">
            {isLoading ? (
               <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#F9E95C]" /></div>
            ) : analytics?.recentLogs?.length === 0 ? (
               <div className="text-[#F9E95C] text-sm p-6 text-center">No queries logged yet.</div>
            ) : (
              analytics?.recentLogs?.map((log: any, i: number) => (
                <div key={i} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#F9E95C]">{log.studentId || 'Anonymous'}</span>
                    <span className="text-[#F9E95C]/80 text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`text-[10px] font-bold uppercase ml-auto px-2 py-0.5 border ${log.status === 'OUT_OF_SCOPE' ? 'border-[#FF5458] text-[#FF5458]' : 'border-[#20B2AA] text-[#20B2AA]'}`}>
                      {log.status === 'OUT_OF_SCOPE' ? 'Out of Scope' : 'Academic'}
                    </span>
                  </div>
                  <p className="text-[#F9E95C]/80 text-sm">{log.query}</p>
                  {log.topic && <span className="text-[10px] font-bold text-[#F9E95C] mt-1 inline-block">{log.topic}</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Topic Distribution */}
        <div className="border-2 border-black flex flex-col" style={{maxHeight: '350px'}}>
          <div className="border-b-2 border-black px-5 py-2 bg-white text-center shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center justify-center gap-2">
              <Database className="w-4 h-4" /> Topic Distribution
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#F9E95C]/50" /></div>
            ) : (analytics?.topicClusters?.length || 0) === 0 ? (
              <div className="text-[#F9E95C] text-sm p-6 text-center">No topics clustered yet.</div>
            ) : (
              <div className="divide-y-2 divide-black">
                {analytics?.topicClusters.map((cluster: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#F9E95C] text-sm">{cluster.topic}</h4>
                      <p className="text-[10px] text-[#F9E95C]">{cluster.count} queries</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-[#F9E95C]">{cluster.percentage}%</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 border ${cluster.health === 'Healthy' ? 'border-[#20B2AA] text-[#20B2AA]' : 'border-[#FF5458] text-[#FF5458]'}`}>
                        {cluster.health}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Reports */}
      <div className="border-2 border-black">
        <div className="border-b-2 border-black px-5 py-2 bg-white flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4 text-black" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">Academic Reports</h3>

          <button 
            onClick={() => setShowStudentsModal(true)}
            className="ml-auto px-3 py-1 border-2 border-black text-black text-xs font-bold uppercase hover:bg-[#F9E95C] transition-all"
          >
            View All
          </button>
        </div>
        
        <div className="divide-y-2 divide-black">
          {students.slice(0, 3).map((student, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-[#F9E95C]">{student.anonymizedName}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${student.health === 'Healthy' ? 'border-[#20B2AA] text-[#20B2AA]' : 'border-[#FF5458] text-[#FF5458]'}`}>
                    {student.health}
                  </span>
                </div>
                <p className="text-xs text-[#F9E95C]">{student.queryCount} queries</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(student.topics || []).slice(0, 3).map((t: string, tIdx: number) => (
                    <span key={tIdx} className="text-[10px] border border-[#F9E95C] px-2 py-0.5 text-[#F9E95C]">{t}</span>
                  ))}
                </div>
              </div>
              <a 
                href={`http://localhost:5000/api/analytics/students/${student.id}/report`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border-2 border-black bg-white text-black text-xs font-bold uppercase hover:bg-[#F9E95C] transition-all shrink-0 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> PDF
              </a>
            </div>
          ))}
          {students.length === 0 && !isLoading && (
            <div className="p-6 text-center text-[#F9E95C] text-sm">No academic records found.</div>
          )}
        </div>
      </div>

      {/* View All Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm pl-[200px]">
          <div className="bg-[#111] border-2 border-black p-8 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowStudentsModal(false)}
              className="absolute top-4 right-4 p-2 text-[#F9E95C]/60 hover:text-[#F9E95C] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#F9E95C] mb-1">All Academic Records</h3>
            <p className="text-[#F9E95C] text-xs mb-4">Complete list of registered students.</p>
            
            <div className="flex-1 overflow-y-auto border-2 border-black divide-y-2 divide-black">
              {students.map((student, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[#F9E95C]">{student.anonymizedName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 border ${student.health === 'Healthy' ? 'border-[#20B2AA] text-[#20B2AA]' : 'border-[#FF5458] text-[#FF5458]'}`}>
                        {student.health}
                      </span>
                    </div>
                    <p className="text-xs text-[#F9E95C]">{student.queryCount} queries · {(student.topics || []).length} topics</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(student.topics || []).slice(0, 5).map((t: string, tIdx: number) => (
                        <span key={tIdx} className="text-[10px] border border-[#F9E95C] px-2 py-0.5 text-[#F9E95C]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <a 
                    href={`http://localhost:5000/api/analytics/students/${student.id}/report`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 border-2 border-black bg-white text-black text-xs font-bold uppercase hover:bg-[#F9E95C] transition-all shrink-0 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Report
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stuck Student Detail Modal */}
      {selectedStuck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border-2 border-black p-8 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setSelectedStuck(null)}
              className="absolute top-4 right-4 p-2 text-[#F9E95C]/60 hover:text-[#F9E95C] transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-[#FF5458]" />
              <div>
                <h3 className="text-lg font-bold text-[#F9E95C]">Student Needs Help</h3>
                <p className="text-[#F9E95C] text-xs">{selectedStuck.anonymizedName} — Stuck on "{selectedStuck.topic}"</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 mt-2">
              <span className="text-[10px] border border-[#FF5458] text-[#FF5458] px-2 py-0.5 font-bold uppercase">Asked {selectedStuck.repeatCount}x</span>
              <span className="text-[10px] border border-[#F9E95C] text-[#F9E95C] px-2 py-0.5 font-bold uppercase">{selectedStuck.topic}</span>
              <span className="text-[10px] text-[#F9E95C] px-2">Last: {new Date(selectedStuck.lastAsked).toLocaleString()}</span>
            </div>

            <div className="flex-1 overflow-y-auto border-2 border-black divide-y-2 divide-black mb-4">
              {selectedStuck.queries.map((q, idx) => (
                <div key={idx}>
                  <div className="p-3 bg-[#FF5458]/5 border-b border-black/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="w-3 h-3 text-[#FF5458]" />
                      <span className="text-[10px] font-bold text-[#FF5458] uppercase">Student</span>
                      <span className="text-[10px] text-[#F9E95C]/80 ml-auto">{new Date(q.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-[#F9E95C]/80 text-sm">{q.query}</p>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-3 h-3 text-[#F9E95C]" />
                      <span className="text-[10px] font-bold text-[#F9E95C] uppercase">AI Tutor</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 border ml-auto ${q.status === 'ANSWERED' ? 'border-[#20B2AA] text-[#20B2AA]' : 'border-[#FF5458] text-[#FF5458]'}`}>{q.status}</span>
                    </div>
                    <p className="text-[#F9E95C]/60 text-sm">{q.response}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-black pt-4">
              {respondedIds.has(`${selectedStuck.studentId}_${selectedStuck.topic}`) ? (
                <div className="flex items-center gap-3 p-4 border-2 border-[#20B2AA]">
                  <CheckCircle2 className="w-5 h-5 text-[#20B2AA] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#20B2AA]">Response Sent</p>
                    <p className="text-xs text-[#F9E95C]">Your answer has been injected into the student's chat session.</p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="text-xs font-bold text-[#F9E95C] uppercase tracking-wider mb-2 block">
                    Write your response
                  </label>
                  <div className="flex gap-3">
                    <textarea
                      value={teacherMessage}
                      onChange={(e) => setTeacherMessage(e.target.value)}
                      placeholder="Explain the concept clearly..."
                      className="flex-1 bg-black/20 border-2 border-black px-4 py-3 text-sm text-[#F9E95C] outline-none focus:border-[#FF5458] resize-none h-20 placeholder:text-[#F9E95C]/20"
                    />
                    <button
                      onClick={handleTeacherRespond}
                      disabled={isSending || !teacherMessage.trim()}
                      className="px-5 border-2 border-black bg-white text-black text-sm font-bold uppercase hover:bg-[#FF5458] hover:text-white hover:border-[#FF5458] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
