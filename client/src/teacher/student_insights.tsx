import { BarChart3, Users, Network, TrendingUp, Search, Database } from 'lucide-react';

export default function StudentInsights() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:text-amber-400 transition-all"><BarChart3 className="w-16 h-16"/></div>
          <h3 className="text-white/40 text-sm font-medium mb-2">Total Student Queries</h3>
          <div className="text-4xl font-bold mb-2">3,492</div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium"><TrendingUp className="w-4 h-4"/> +14% from last week</div>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:text-violet-400 transition-all"><Users className="w-16 h-16"/></div>
          <h3 className="text-white/40 text-sm font-medium mb-2">Active Students (Daily)</h3>
          <div className="text-4xl font-bold mb-2">156</div>
          <div className="text-white/30 text-sm">82% of enrolled class</div>
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
        
        {/* Visual Chart: Common Queries (Native Bar Chart) */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col">
          <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            Common Student Queries
          </h3>
          
          <div className="flex flex-col gap-6 flex-1">
            {[
              { query: "Formula for expanding entropy in closed systems?", perc: 78, color: "bg-amber-500" },
              { query: "When is the midterm assignment due?", perc: 65, color: "bg-violet-500" },
              { query: "Can you explain the second law of thermodynamics?", perc: 45, color: "bg-red-400" },
              { query: "What are real-world examples of open systems?", perc: 25, color: "bg-blue-400" },
              { query: "Summary of chapter 4 required reading?", perc: 15, color: "bg-emerald-400" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80 font-medium truncate pr-4">{item.query}</span>
                  <span className="text-white/40 shrink-0">{item.perc}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color} shadow-[0_0_10px_currentColor]`} 
                    style={{ width: `${item.perc}%` }}
                  />
                </div>
              </div>
            ))}
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
