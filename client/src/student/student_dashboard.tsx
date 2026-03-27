import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, Clock, TrendingUp, Flame, ChevronRight, FileText, 
  BrainCircuit, LogOut, Settings 
} from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function StudentAnalyticsDashboard() {
    const { user, token, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);

    // Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        name: user?.name || '',
        className: user?.className || '',
        semester: user?.semester || ''
    });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchDocs = async () => {
            try {
                const params = new URLSearchParams({
                    className: user.className || '',
                    department: user.department || '',
                    semester: user.semester || ''
                });
                
                const url = `${API_BASE_URL}/api/documents?${params.toString()}`;
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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
    }, [user, token]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

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
                        <div className="text-xs text-white/40 text-right mr-2 hidden md:block">
                            <div className="font-bold text-white/70">{user.department}</div>
                            <div>{user.className} • {user.semester}</div>
                        </div>
                        <button 
                            onClick={() => setShowProfileModal(true)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-amber-500"
                            title="Edit Profile"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-red-400"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto min-h-0 custom-scrollbar mesh-gradient">
                <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold mb-2">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
                        <p className="text-white/50">Here is your {user.semester} learning overview.</p>
                    </div>
                    <Link to="/student/notebook" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full transition-all flex items-center gap-2 w-fit">
                        Open arynox.llm <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Courses', value: '6', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Study Hours', value: '24.5', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                        { label: 'Avg Confidence', value: '82%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Daily Streak', value: '12', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10' }
                    ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-white/40 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-amber-500" />
                        Explore My Modules
                    </h2>
                    <div className="text-xs text-white/30 uppercase tracking-widest font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        {user.department} • {user.semester}
                    </div>
                </div>

                {isLoadingDocs ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-[32px] bg-white/5 animate-pulse border border-white/10"></div>
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-20 rounded-[40px] border border-dashed border-white/10 bg-white/[0.02] text-center mb-12">
                        <FileText className="w-16 h-16 text-white/10 mx-auto mb-6" />
                        <h3 className="text-xl text-white/50 font-semibold">Ready for your first lesson?</h3>
                        <p className="text-white/20 text-sm mt-2 max-w-sm mx-auto">Your faculty hasn't organized any modules yet. Check back soon for your learning path!</p>
                    </div>
                ) : (
                    <div className="space-y-12 mb-20">
                        {Object.entries(
                            documents.reduce((acc, doc) => {
                                const sub = doc.subject || 'General Studies';
                                if (!acc[sub]) acc[sub] = {};
                                const mod = doc.module || 'Introductory';
                                if (!acc[sub][mod]) acc[sub][mod] = [];
                                acc[sub][mod].push(doc);
                                return acc;
                            }, {} as Record<string, Record<string, any[]>>)
                        ).map(([subject, modules]) => (
                            <div key={subject} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <h3 className="text-sm font-black text-amber-500/80 uppercase tracking-[0.2em]">{subject}</h3>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(modules as Record<string, any[]>).map(([module, docs]) => (
                                        <div 
                                            key={module}
                                            onClick={() => navigate(`/student/notebook?subject=${encodeURIComponent(subject)}&module=${encodeURIComponent(module)}`)}
                                            className="group relative p-8 rounded-[32px] bg-[#111] border border-white/5 hover:border-amber-500/40 transition-all duration-500 cursor-pointer overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                        >
                                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
                                            
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                                        <BrainCircuit className="w-7 h-7 text-white/20 group-hover:text-amber-500 transition-colors" />
                                                    </div>
                                                    <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <ChevronRight className="w-5 h-5 text-amber-500" />
                                                    </div>
                                                </div>
                                                
                                                <h4 className="text-xl font-bold text-white/90 mb-2 group-hover:text-white transition-colors capitalize">{module}</h4>
                                                <p className="text-sm text-white/40 mb-6 line-clamp-2">Master this module with interactive Socratic tutoring and voice-enabled learning.</p>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="flex -space-x-3">
                                                        {(docs as any[]).slice(0, 3).map((_: any, i: number) => (
                                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111] bg-[#1a1b1c] flex items-center justify-center">
                                                                <FileText className="w-3 h-3 text-white/30" />
                                                            </div>
                                                        ))}
                                                        {(docs as any[]).length > 3 && (
                                                            <div className="w-8 h-8 rounded-full border-2 border-[#111] bg-[#1a1b1c] flex items-center justify-center text-[10px] font-bold text-white/40">
                                                                +{(docs as any[]).length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium text-white/30 group-hover:text-amber-500/60 transition-colors">
                                                        {(docs as any[]).length} Unit{(docs as any[]).length !== 1 ? 's' : ''} • Ready
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </main>

            {/* Profile Edit Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#111] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <Settings className="w-6 h-6 text-amber-500" />
                                Student Profile
                            </h3>
                            <p className="text-sm text-white/40 mt-1">Update your academic track and preferences.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Display Name</label>
                                    <input 
                                        type="text" value={profileFormData.name}
                                        onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Class / Year</label>
                                        <select 
                                            value={profileFormData.className}
                                            onChange={(e) => setProfileFormData({...profileFormData, className: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all [&>option]:bg-[#111]"
                                        >
                                            {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Semester</label>
                                        <select 
                                            value={profileFormData.semester}
                                            onChange={(e) => setProfileFormData({...profileFormData, semester: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all [&>option]:bg-[#111]"
                                        >
                                            {['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                className="px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/5 transition-all text-white/70"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={async () => {
                                    setIsUpdating(true);
                                    try {
                                        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
                                            method: 'PUT',
                                            headers: { 
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}` 
                                            },
                                            body: JSON.stringify(profileFormData)
                                        });
                                        if (res.ok) {
                                            updateUser(profileFormData);
                                            setShowProfileModal(false);
                                        }
                                    } catch (err) {
                                        console.error("Profile update failed", err);
                                    } finally {
                                        setIsUpdating(false);
                                    }
                                }}
                                disabled={isUpdating}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2"
                            >
                                {isUpdating && <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
