import { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, Building2, 
    TrendingUp, AlertTriangle, ChevronRight, BarChart3,
    PieChart, Activity, Search, LogOut, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function AdminDashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [deptActivity, setDeptActivity] = useState<any[]>([]);
    const [subjectConfusion, setSubjectConfusion] = useState<any[]>([]);
    
    const [activeTab, setActiveTab] = useState<'overview' | 'faculty' | 'departments'>('overview');
    const [faculty, setFaculty] = useState<any[]>([]);
    const [isFacultyLoading, setIsFacultyLoading] = useState(false);
    
    // Edit Modal State
    const [editFaculty, setEditFaculty] = useState<any | null>(null);
    const [facultyFormData, setFacultyFormData] = useState({
        name: '',
        department: '',
        subjects: '' // will be converted to array
    });

    useEffect(() => {
        fetchOverview();
        if (activeTab === 'faculty') fetchFaculty();
    }, [activeTab]);

    const fetchOverview = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/analytics/university-overview`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setDeptActivity(data.deptActivity);
                setSubjectConfusion(data.subjectConfusion);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFaculty = async () => {
        try {
            setIsFacultyLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/users/faculty`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFaculty(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFacultyLoading(false);
        }
    };

    const handleUpdateFaculty = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/faculty/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...facultyFormData,
                    subjects: facultyFormData.subjects.split(',').map(s => s.trim()).filter(s => s)
                })
            });
            if (res.ok) {
                setEditFaculty(null);
                fetchFaculty();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteFaculty = async (id: string) => {
        if (!window.confirm("Remove this faculty member? Their account will be deactivated.")) return;
        try {
            await fetch(`${API_BASE_URL}/api/users/faculty/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchFaculty();
        } catch (err) {
            console.error(err);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <p>Access Denied. Admins Only.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e3e3e3] font-sans selection:bg-amber-500/30 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-[#0b0b0b] flex flex-col shrink-0">
                <div className="p-8 pb-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">ARYNOX <span className="text-amber-500 text-xs ml-1 uppercase">Admin</span></span>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'overview' ? 'bg-white/5 text-amber-500' : 'text-white/40 hover:bg-white/5'}`}
                    >
                        <Activity className="w-4 h-4" />
                        Campus Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('faculty')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'faculty' ? 'bg-white/5 text-amber-500' : 'text-white/40 hover:bg-white/5'}`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Faculty Registry
                    </button>
                    <button 
                        onClick={() => setActiveTab('departments')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'departments' ? 'bg-white/5 text-amber-500' : 'text-white/40 hover:bg-white/5'}`}
                    >
                        <Building2 className="w-4 h-4" />
                        Departments
                    </button>
                </nav>

                <div className="p-6">
                    <button 
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500/60 hover:bg-red-500/5 hover:text-red-500 transition-all font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto mesh-gradient">
                <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#0b0b0b]/50 backdrop-blur-md sticky top-0 z-50">
                    <div>
                        <h1 className="text-lg font-bold text-white">
                            {activeTab === 'overview' ? 'University Global Command' : activeTab === 'faculty' ? 'Faculty Governance' : 'Departmental Oversight'}
                        </h1>
                        <p className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-black">
                            {activeTab === 'overview' ? 'All Campus Analytics' : activeTab === 'faculty' ? 'Role & Expertise Management' : 'Academic Footprint'}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-amber-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search..."
                                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-6 text-xs w-80 outline-none focus:border-amber-500/50 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white">{user.name}</p>
                                <p className="text-[10px] text-white/40 font-black uppercase">Chancellor / Admin</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 border-2 border-[#0a0a0a] shadow-lg flex items-center justify-center font-black text-xs uppercase">
                                {user.name[0]}{user.name.split(' ')[1]?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto space-y-10">
                    {activeTab === 'overview' && (
                        <>
                            {/* Top Stats */}
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Queries', value: stats?.totalQueries || '0', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                    { label: 'Active Learners', value: stats?.totalStudents || '0', icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                                    { label: 'Course Materials', value: stats?.totalDocs || '0', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                    { label: 'Faculty Members', value: stats?.totalTeachers || '0', icon: GraduationCap, color: 'text-red-400', bg: 'bg-red-400/10' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-[32px] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group overflow-hidden relative">
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                                <stat.icon className="w-6 h-6" />
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                                        </div>
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-amber-500/5 transition-all" />
                                    </div>
                                ))}
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Departmental Activity */}
                                <div className="lg:col-span-2 p-8 rounded-[40px] bg-[#0b0b0b] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.02] rounded-full blur-[100px]" />
                                    <div className="relative z-10 flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                                <Building2 className="w-5 h-5 text-amber-500" />
                                                Departmental Momentum
                                            </h3>
                                            <p className="text-xs text-white/40 mt-1">Cross-campus student engagement levels.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {deptActivity.map((dept, i) => (
                                            <div key={i} className="space-y-2 group/bar">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-white/60 group-hover/bar:text-amber-500 transition-colors">{dept.name}</span>
                                                    <span className="text-white/40">{dept.value} queries</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-1000 group-hover/bar:brightness-125"
                                                        style={{ width: `${Math.min(100, (dept.value / (stats?.totalQueries || 1)) * 300)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject Confusion Heatmap */}
                                <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 backdrop-blur-sm relative overflow-hidden group">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        Critical Confusion
                                    </h3>
                                    <p className="text-xs text-white/40 mb-8 font-medium">Top subjects requiring academic intervention.</p>
                                    
                                    <div className="space-y-4">
                                        {subjectConfusion.map((item, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-red-500/20 transition-all flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-white/80 uppercase tracking-tighter">{item.subject}</p>
                                                    <p className="text-10px text-white/30 font-bold">{item.count} unhandled doubts</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                                    <ChevronRight className="w-4 h-4 text-red-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'faculty' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Users className="w-6 h-6 text-amber-500" />
                                    Faculty Registry
                                </h2>
                                <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:border-amber-500/50 transition-all">Export Report</button>
                            </div>

                            {isFacultyLoading ? (
                                <div className="flex justify-center p-20"><Activity className="w-10 h-10 animate-spin text-amber-500" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {faculty.map(f => (
                                        <div key={f._id} className="p-6 rounded-[32px] bg-[#0b0b0b] border border-white/5 group hover:border-amber-500/20 transition-all relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-orange-500/10 flex items-center justify-center font-black text-amber-500 text-lg uppercase">
                                                    {(f.name || 'F')[0]}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setEditFaculty(f);
                                                            setFacultyFormData({
                                                                name: f.name,
                                                                department: f.department || '',
                                                                subjects: (f.subjects || []).join(', ')
                                                            });
                                                        }}
                                                        className="p-2 text-white/20 hover:text-amber-500 transition-all"
                                                    >
                                                        <Activity className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteFaculty(f._id)}
                                                        className="p-2 text-white/20 hover:text-red-500 transition-all"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-white mb-1">{f.name}</h4>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-4">{f.department || 'Unassigned Dept'}</p>
                                            
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {(f.subjects || []).slice(0, 3).map((s: string, i: number) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-tighter">
                                                        {s}
                                                    </span>
                                                ))}
                                                {f.subjects?.length > 3 && <span className="text-[9px] text-white/20 font-bold">+{f.subjects.length - 3} more</span>}
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Faculty Access</span>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'departments' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Building2 className="w-6 h-6 text-amber-500" />
                                    Departmental Footprint
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {deptActivity.map((dept, i) => (
                                    <div key={i} className="p-8 rounded-[40px] bg-[#0b0b0b] border border-white/5 group hover:border-amber-500/20 transition-all relative overflow-hidden">
                                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-amber-500/10 transition-colors">
                                            <Building2 className="w-6 h-6 text-white/20 group-hover:text-amber-500" />
                                        </div>

                                        <h4 className="text-xl font-bold text-white mb-2">{dept.name}</h4>
                                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
                                            <div className="flex items-center gap-1.5 text-amber-500/60">
                                                <Activity className="w-3 h-3" />
                                                {dept.value} Queries
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <div className="flex items-center gap-1.5">
                                                <GraduationCap className="w-3 h-3" />
                                                {faculty.filter(f => f.department === dept.name).length} Faculty
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">Institutional Stats</span>
                                            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-amber-500 transform group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {editFaculty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                    <div className="bg-[#0e0e0e] border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-10 border-b border-white/5">
                            <h3 className="text-2xl font-black text-white italic">MODIFY FACULTY</h3>
                            <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Update roles and expertise</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.2em]">Full Name</label>
                                    <input 
                                        type="text" value={facultyFormData.name}
                                        onChange={(e) => setFacultyFormData({...facultyFormData, name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-amber-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.2em]">Department</label>
                                    <input 
                                        type="text" value={facultyFormData.department}
                                        onChange={(e) => setFacultyFormData({...facultyFormData, department: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-amber-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.2em]">Subject Expertise (comma separated)</label>
                                    <textarea 
                                        value={facultyFormData.subjects}
                                        onChange={(e) => setFacultyFormData({...facultyFormData, subjects: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-amber-500 transition-all font-medium h-32"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-white/[0.02] flex justify-end gap-3">
                            <button onClick={() => setEditFaculty(null)} className="px-8 py-3 rounded-full text-xs font-black uppercase text-white/40 hover:text-white transition-all">Discard</button>
                            <button 
                                onClick={() => handleUpdateFaculty(editFaculty._id)}
                                className="px-10 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-full text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                            >
                                Confirm Updates
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
