
import { BookOpen, Clock, TrendingUp, Flame, ChevronRight, FileText, Activity, BrainCircuit, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

export default function StudentAnalyticsDashboard() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);

    const studentProfile = {
        id: 'student_123',
        name: 'Rajdeep Seal',
        className: '2nd Year',
        department: 'Computer Science'
    };

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                // Unified filtering with Department Isolation logic
                const url = `http://localhost:5000/api/documents?className=${encodeURIComponent(studentProfile.className)}&department=${encodeURIComponent(studentProfile.department)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setDocuments(data);
                }
            } catch (err) {
                console.error("Failed to fetch documents", err);
            } finally {
                setIsLoadingDocs(false);
            }
        };
        fetchDocs();
    }, []);

    return (
        <div className="h-screen w-full bg-[#0a0a0a] text-white font-sans selection:bg-amber-500/30 flex flex-col overflow-hidden">
            {/* Top Navigation */}
            <nav className="border-b border-white/10 bg-[#0b0b0b] shrink-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-amber-500" />
                        <span className="text-xl font-bold tracking-tight">ARYNOX</span>
                        <span className="text-white/30 mx-2">|</span>
                        <span className="text-sm font-medium text-white/70">Student Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-vermilion-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            JS
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto min-h-0 custom-scrollbar mesh-gradient">
                <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold mb-2">Welcome back, John! 👋</h1>
                        <p className="text-white/50">Here is your learning overview for this week.</p>
                    </div>
                    <Link to="/student/notebook" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full transition-all flex items-center gap-2 w-fit">
                        Open arynox.llm <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Analytics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {/* Card 1 */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-16 h-16 text-amber-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white/50 text-sm font-medium mb-1">Total Hours Studied</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold">124</span>
                                <span className="text-white/50">hrs</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                                <TrendingUp className="w-4 h-4" /> +12% from last week
                            </div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen className="w-16 h-16 text-blue-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white/50 text-sm font-medium mb-1">Active Courses</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold">4</span>
                            </div>
                            <div className="text-white/40 text-sm">
                                2 assignments pending
                            </div>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="w-16 h-16 text-violet-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white/50 text-sm font-medium mb-1">Average Score</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold">94</span>
                                <span className="text-white/50">%</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                                <TrendingUp className="w-4 h-4" /> Top 5% in class
                            </div>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Flame className="w-16 h-16 text-orange-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white/50 text-sm font-medium mb-1">Daily Streak</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold text-orange-500">14</span>
                                <span className="text-white/50">Days</span>
                            </div>
                            <div className="text-white/40 text-sm">
                                You're on fire! Keep it up.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Recent AI Notebooks */}
                    <div className="lg:col-span-2">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Your Notebooks</h2>
                                <button className="text-sm text-amber-500 hover:text-amber-400 transition-colors">View All</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {isLoadingDocs ? (
                                    <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center justify-center min-h-[160px]">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                                    </div>
                                ) : (
                                    <>
                                        {documents.slice(0, 3).map((doc: any, index: number) => (
                                            <Link key={doc._id} to={`/student/notebook?docId=${doc._id}&name=${encodeURIComponent(doc.title)}`} className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.02] transition-all group cursor-pointer block hover:shadow-[0_8px_30px_rgba(245,158,11,0.05)]">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <h3 className="font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">{doc.title}</h3>
                                                <p className="text-sm text-white/50 mb-4 line-clamp-2">Socratic workspace prepared by {doc.department} dept.</p>
                                                <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                                                    <span>Active RAG Base</span>
                                                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                        ))}

                                        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/20 transition-all group cursor-pointer border-dashed border-white/10 flex flex-col items-center justify-center min-h-[160px]">
                                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-3 group-hover:bg-white/5 transition-colors">
                                                <Plus className="w-5 h-5 text-white/50" />
                                            </div>
                                            <span className="font-medium text-white/70">Create New Notebook</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Next Steps / Up Next */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col">
                        <h2 className="text-lg font-semibold mb-6 flex-shrink-0">Upcoming Tasks</h2>
                        <div className="flex flex-col gap-4 flex-1">
                            {[
                                { title: 'Thermodynamics Midterm', time: 'Tomorrow, 10:00 AM', color: 'bg-red-500/20', dot: 'bg-red-500' },
                                { title: 'Lab Report Submission', time: 'Friday, 11:59 PM', color: 'bg-amber-500/20', dot: 'bg-amber-500' },
                                { title: 'Group Study Session', time: 'Saturday, 2:00 PM', color: 'bg-blue-500/20', dot: 'bg-blue-500' },
                            ].map((task, i) => (
                                <div key={i} className="flex gap-4 items-start p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${task.dot} shadow-[0_0_8px_currentColor]`} />
                                    <div>
                                        <h4 className="font-medium text-[15px] mb-0.5 text-white/90">{task.title}</h4>
                                        <div className="text-sm text-white/50">{task.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            </main>
        </div>
    );
}
