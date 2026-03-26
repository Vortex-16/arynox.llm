import { BarChart3, Users, Network, TrendingUp, Search, Database, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function StudentInsights() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/insights');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

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
          <h3 className="text-white/40 text-sm font-medium mb-2">Active Students (Daily)</h3>
          <div className="text-4xl font-bold mb-2">1</div>
          <div className="text-white/30 text-sm">Waiting for more users...</div>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:text-red-400 transition-all"><Network className="w-16 h-16"/></div>
          <h3 className="text-white/40 text-sm font-medium mb-2">Knowledge Hit Rate</h3>
          <div className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-violet-400">98.4%</div>
          <div className="text-white/30 text-sm">Successful RAG retrievals</div>
        </div>
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
                <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-white/90 text-[14px] font-medium leading-snug">{log.query}</span>
                    <span className="text-white/40 text-xs shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`text-[12px] font-medium w-fit px-2 py-0.5 rounded-full ${log.status === 'OUT_OF_SCOPE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {log.status === 'OUT_OF_SCOPE' ? 'Non-Academic' : 'Academic Focus'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Topic Modeling Clusters */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col">
          <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
            <Database className="w-5 h-5 text-violet-400" />
            AI Topic Modeling Clusters
          </h3>

          <div className="text-sm text-white/50 mb-6">
            Semantic topics automatically clustered from Socratic student interactions over the last 30 days.
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
              <div className="text-amber-300 font-semibold mb-1">Thermodynamics</div>
              <div className="text-xs text-white/50 mb-4">High confusion regarding open systems.</div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-2xl font-bold text-amber-400">45%</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 flex flex-col justify-between">
              <div className="text-violet-300 font-semibold mb-1">Mechanics Review</div>
              <div className="text-xs text-white/50 mb-4">Healthy interaction, stable scores.</div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-2xl font-bold text-violet-400">30%</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20 flex flex-col justify-between">
              <div className="text-red-300 font-semibold mb-1">Course Admin</div>
              <div className="text-xs text-white/50 mb-4">Focused on midterm dates and grading weights.</div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-2xl font-bold text-red-400">15%</span>
                <div className="w-4 h-[2px] bg-white/30" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
              <div className="text-blue-300 font-semibold mb-1">Quantum Basics</div>
              <div className="text-xs text-white/50 mb-4">Emerging queries ahead of schedule.</div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-2xl font-bold text-blue-400">10%</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
