import { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, Building2, 
    AlertTriangle, ChevronRight, BarChart3,
    Activity, Search, LogOut, MessageSquare, Plus, Trash2, Edit2, CheckCircle2, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

type Tab = 'overview' | 'faculty' | 'departments' | 'subjects' | 'students';

export default function AdminDashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [deptActivity, setDeptActivity] = useState<any[]>([]);
    const [subjectConfusion, setSubjectConfusion] = useState<any[]>([]);
    
    const [faculty, setFaculty] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showDeptModal, setShowDeptModal] = useState(false);
    // const [showSubjectModal, setShowSubjectModal] = useState(false);
    // const [editingItem, setEditingItem] = useState<any>(null);

    // Form States
    const [deptForm, setDeptForm] = useState({ name: '', code: '', hodName: '', hodEmail: '' });
    // const [subjectForm, setSubjectForm] = useState({ name: '', code: '', departmentCode: '', program: 'BTech', semester: 1 });

    useEffect(() => {
        if (!token) return;
        refreshData();
    }, [activeTab, token]);

    const refreshData = () => {
        switch(activeTab) {
            case 'overview': fetchStats(); break;
            case 'faculty': fetchFaculty(); break;
            case 'students': fetchStudents(); break;
            case 'departments': fetchDepartments(); break;
            case 'subjects': fetchSubjects(); break;
        }
    };

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setDeptActivity(data.deptActivity);
                setSubjectConfusion(data.subjectConfusion);
                setRecentUsers(data.recentUsers);
            }
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const fetchFaculty = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/admin/faculty`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setFaculty(await res.json());
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/admin/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStudents(await res.json());
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const fetchDepartments = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDepartments(await res.json());
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const fetchSubjects = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/admin/subjects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSubjects(await res.json());
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleCreateDept = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...deptForm, programs: [{ name: 'Bachelor of Technology', type: 'BTech', totalSemesters: 8 }] })
            });
            if (res.ok) {
                setShowDeptModal(false);
                setDeptForm({ name: '', code: '', hodName: '', hodEmail: '' });
                fetchDepartments();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create department');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteUser = async (id: string, role: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${role}?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                role === 'teacher' ? fetchFaculty() : fetchStudents();
            }
        } catch (err) { console.error(err); }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-white/40 mt-2">Administrative privileges required.</p>
                    <button onClick={() => navigate('/login')} className="mt-6 px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">Back to Login</button>
                </div>
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

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <SidebarItem icon={Activity} label="Campus Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <SidebarItem icon={Building2} label="Departments" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
                    <SidebarItem icon={BookOpen} label="Subject Registry" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
                    <SidebarItem icon={GraduationCap} label="Faculty Registry" active={activeTab === 'faculty'} onClick={() => setActiveTab('faculty')} />
                    <SidebarItem icon={Users} label="Student Bodies" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
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
                        <h1 className="text-lg font-bold text-white uppercase tracking-tight">
                            {activeTab.replace(/([A-Z])/g, ' $1')} Command Center
                        </h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                            Arynox Neural Academic Network
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-amber-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Universal search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-6 text-xs w-80 outline-none focus:border-amber-500/50 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white">{user.name}</p>
                                <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">System Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 border border-white/10 shadow-xl flex items-center justify-center font-black text-sm uppercase">
                                {user.name[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto space-y-10">
                    {activeTab === 'overview' && <OverviewTab stats={stats} deptActivity={deptActivity} subjectConfusion={subjectConfusion} recentUsers={recentUsers} isLoading={isLoading} />}
                    {activeTab === 'departments' && <DepartmentsTab departments={departments} onAdd={() => setShowDeptModal(true)} isLoading={isLoading} />}
                    {activeTab === 'subjects' && <SubjectsTab subjects={subjects} isLoading={isLoading} />}
                    {activeTab === 'faculty' && <UserListTab users={faculty} role="teacher" onDelete={(id) => handleDeleteUser(id, 'teacher')} isLoading={isLoading} />}
                    {activeTab === 'students' && <UserListTab users={students} role="student" onDelete={(id) => handleDeleteUser(id, 'student')} isLoading={isLoading} />}
                </div>
            </main>

            {/* Department Modal */}
            {showDeptModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-[40px] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <Building2 className="w-6 h-6 text-amber-500" />
                                New Department
                            </h3>
                            <p className="text-sm text-white/40 mt-1">Define systemic academic cluster</p>
                        </div>
                        <div className="p-8 space-y-5">
                            <Input label="Dept Name" value={deptForm.name} onChange={v => setDeptForm({...deptForm, name: v})} placeholder="e.g. Computer Science" />
                            <Input label="Dept Code" value={deptForm.code} onChange={v => setDeptForm({...deptForm, code: v})} placeholder="e.g. CSE" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="HOD Name" value={deptForm.hodName} onChange={v => setDeptForm({...deptForm, hodName: v})} placeholder="Name" />
                                <Input label="HOD Email" value={deptForm.hodEmail} onChange={v => setDeptForm({...deptForm, hodEmail: v})} placeholder="Email" />
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-3">
                            <button onClick={() => setShowDeptModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold hover:bg-white/5 transition-all text-white/40">Cancel</button>
                            <button onClick={handleCreateDept} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl text-sm font-black transition-all shadow-lg">Initialize Dept</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Components ────────────────────────────────────────────────────────────────

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${active ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-amber-500/40'}`} />
            {label}
        </button>
    );
}

function Input({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
    return (
        <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-white/20 mb-2">{label}</label>
            <input 
                type="text" value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-amber-500 transition-all font-medium"
            />
        </div>
    );
}

function OverviewTab({ stats, deptActivity, subjectConfusion, recentUsers, isLoading }: any) {
    if (isLoading && !stats) return <div className="flex justify-center p-20"><Loader /></div>;
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Interaction" value={stats?.totalQueries} icon={MessageSquare} color="text-amber-500" />
                <StatCard label="Student Body" value={stats?.totalStudents} icon={Users} color="text-blue-400" />
                <StatCard label="Faculty Core" value={stats?.totalTeachers} icon={GraduationCap} color="text-violet-400" />
                <StatCard label="Knowledge Base" value={stats?.totalDocs} icon={BookOpen} color="text-emerald-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ChartBox title="Departmental Momentum" sub="Query density across academic clusters" icon={Building2}>
                        <div className="space-y-6">
                            {deptActivity?.map((dept: any, i: number) => (
                                <div key={i} className="space-y-2 group">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-white/60 group-hover:text-amber-500 transition-colors">{dept.name}</span>
                                        <span className="text-white/30">{dept.value} signals</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (dept.value / (stats?.totalQueries || 1)) * 300)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!deptActivity || deptActivity.length === 0) && <p className="text-center py-10 text-white/20 italic font-medium">No activity data yet</p>}
                        </div>
                    </ChartBox>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <RecentUsersList users={recentUsers} />
                        <ChartBox title="Critical Friction" sub="High confusion subject vectors" icon={AlertTriangle}>
                            <div className="space-y-3">
                                {subjectConfusion?.map((item: any, i: number) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-red-500/20 transition-all">
                                        <div>
                                            <p className="text-xs font-black text-white/90 uppercase tracking-tighter">{item.subject}</p>
                                            <p className="text-[10px] text-red-500/60 font-black uppercase mt-0.5">{item.count} unhandled doubts</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-red-500 transition-all" />
                                    </div>
                                ))}
                                {(!subjectConfusion || subjectConfusion.length === 0) && <p className="text-center py-6 text-white/20 italic font-medium">Clear skies — no friction detected</p>}
                            </div>
                        </ChartBox>
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div className="p-8 rounded-[40px] bg-gradient-to-br from-amber-600 to-orange-600 shadow-2xl shadow-amber-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Building2 className="w-20 h-20 text-white/10 absolute -bottom-4 -right-4 rotate-12" />
                        <div className="relative z-10">
                            <h4 className="text-lg font-black text-black uppercase leading-tight mb-2">Platform<br/>Health Matrix</h4>
                            <p className="text-black/60 text-xs font-bold mb-6">Synergistic academic throughput is currently 98.4% above baseline.</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                <Activity className="w-3 h-3" />
                                Optimal Engine State
                            </div>
                        </div>
                    </div>
                    {/* Additional small widgets can go here */}
                </div>
            </div>
        </div>
    );
}

function DepartmentsTab({ departments, onAdd, isLoading }: any) {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex justify-between items-center bg-[#111] p-8 rounded-[40px] border border-white/5">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Academic Clusters</h2>
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Foundational department infrastructure</p>
                </div>
                <button 
                    onClick={onAdd}
                    className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-amber-500/10 active:scale-95 text-xs uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" />
                    Initialize Dept
                </button>
            </div>

            {isLoading ? <div className="flex justify-center p-20"><Loader /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept: any) => (
                        <div key={dept._id} className="p-10 rounded-[48px] bg-[#0b0b0b] border border-white/5 group hover:border-amber-500/30 transition-all relative overflow-hidden">
                             <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] flex items-center justify-center mb-8 group-hover:bg-amber-500/10 transition-colors border border-white/5 shadow-inner">
                                <Building2 className="w-8 h-8 text-white/10 group-hover:text-amber-500 transition-colors" />
                             </div>
                             <div className="mb-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">{dept.code}</span>
                                {!dept.isActive && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-black uppercase">Inactive</span>}
                             </div>
                             <h4 className="text-2xl font-black text-white mb-2 leading-tight">{dept.name}</h4>
                             <p className="text-xs text-white/30 font-bold mb-8 italic">Lead: {dept.hodName || 'Undesignated'}</p>
                             
                             <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" />
                                    {dept.programs?.length || 0} Programs Active
                                </div>
                             </div>

                             <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0b0b0b] bg-white/5" />)}
                                </div>
                                <button className="p-3 rounded-xl bg-white/5 text-white/20 hover:text-amber-500 hover:bg-amber-500/10 transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                             </div>
                        </div>
                    ))}
                    {departments.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[50px]">
                            <Building2 className="w-16 h-16 text-white/5 mx-auto mb-6" />
                            <h4 className="text-xl font-bold text-white/20 uppercase tracking-widest italic">Zero clusters instantiated</h4>
                            <p className="text-xs text-white/10 mt-2 font-black uppercase tracking-[0.2em]">Deploy first department cluster to begin</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SubjectsTab({ subjects, isLoading }: any) {
    return (
        <div className="space-y-8 animate-in slide-in-from-right-5 duration-500">
            <div className="bg-[#111] p-8 rounded-[40px] border border-white/5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Knowledge Registry</h2>
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Centralized subject-matter governance</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <button className="px-4 py-2 bg-amber-500 text-black text-[10px] font-black rounded-xl shadow-lg uppercase tracking-widest">Active Core</button>
                    <button className="px-4 py-2 text-white/30 text-[10px] font-black rounded-xl hover:text-white transition-all uppercase tracking-widest">Archived</button>
                </div>
            </div>

            {isLoading ? <div className="flex justify-center p-20"><Loader /></div> : (
                <div className="bg-[#0b0b0b] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Subject Information</th>
                                <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Cluster</th>
                                <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Timeline</th>
                                <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Faculty Lead</th>
                                <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {subjects.map((sub: any) => (
                                <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-white/30 group-hover:text-amber-500 transition-colors">
                                                {sub.code}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{sub.name}</p>
                                                <p className="text-[10px] text-white/30 font-black uppercase mt-0.5">{sub.credits || 4} Credits</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-lg uppercase tracking-tighter shadow-inner">
                                            {sub.departmentCode}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div>
                                            <p className="text-xs font-bold text-white/80">{sub.program}</p>
                                            <p className="text-[10px] text-white/30 font-black uppercase mt-0.5">Sem {sub.semester}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-bold text-white/40">
                                                {sub.assignedTeacherName ? sub.assignedTeacherName[0] : '?'}
                                            </div>
                                            <span className="text-xs font-bold text-white/60">{sub.assignedTeacherName || 'Not Assigned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button className="p-2 text-white/20 hover:text-amber-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subjects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <p className="text-[11px] font-black text-white/10 uppercase tracking-[0.3em] italic">Knowledge registry empty — please initialize subjects</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function UserListTab({ users, role, onDelete, isLoading }: { users: any[], role: 'teacher' | 'student', onDelete: (id: string) => void, isLoading: boolean }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-[#111] p-8 rounded-[40px] border border-white/5 flex justify-between items-center shadow-xl">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">{role === 'teacher' ? 'Faculty Nexus' : 'Student Collective'}</h2>
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">High-level humanitarian access & governance</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {users.length} Identities
                    </div>
                </div>
            </div>

            {isLoading ? <div className="flex justify-center p-20"><Loader /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(u => (
                        <div key={u._id} className="p-8 rounded-[36px] bg-[#0b0b0b] border border-white/5 group hover:border-amber-500/20 transition-all relative overflow-hidden backdrop-blur-sm">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             
                             <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center font-black text-amber-500 text-xl shadow-inner group-hover:scale-110 transition-transform">
                                    {u.name[0]}
                                </div>
                                <button 
                                    onClick={() => onDelete(u._id)}
                                    className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-black rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>

                             <h4 className="text-lg font-bold text-white mb-1 leading-tight">{u.name}</h4>
                             <p className="text-xs font-medium text-white/30 mb-6 truncate">{u.email}</p>

                             <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Cluster</p>
                                    <p className="text-[10px] font-black text-white/70 uppercase truncate">{u.department || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">{role === 'teacher' ? 'Access' : 'Semester'}</p>
                                    <p className="text-[10px] font-black text-white/70 uppercase">{role === 'teacher' ? 'Active' : u.semester || 'S1'}</p>
                                </div>
                             </div>

                             <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Identity ID: {u._id.slice(-6)}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Online</span>
                                </div>
                             </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                         <div className="col-span-full py-32 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[50px]">
                            <Users className="w-16 h-16 text-white/5 mx-auto mb-6" />
                            <h4 className="text-xl font-bold text-white/20 uppercase tracking-widest italic">Zero {role}s localized</h4>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RecentUsersList({ users }: any) {
    return (
        <ChartBox title="Recent Signals" sub="Newest identities localized in nexus" icon={Activity}>
            <div className="space-y-4">
                {users?.map((u: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/30 group-hover:text-amber-500 transition-colors">
                                {u.name[0]}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/90">{u.name}</p>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">{u.role} • {u.department || 'Global'}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-white/10 uppercase tracking-widest group-hover:text-amber-500/40 transition-colors">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
                {(!users || users.length === 0) && <p className="text-center py-6 text-white/20 italic font-medium">No signals detected</p>}
            </div>
        </ChartBox>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="p-6 rounded-[32px] bg-[#0b0b0b]/80 border border-white/5 group hover:border-amber-500/20 transition-all overflow-hidden relative backdrop-blur-md shadow-2xl">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <h3 className="text-3xl font-black text-white italic tracking-tight">{value || 0}</h3>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function ChartBox({ title, sub, icon: Icon, children }: any) {
    return (
        <div className="p-8 rounded-[48px] bg-[#0b0b0b]/60 border border-white/5 relative overflow-hidden group shadow-2xl backdrop-blur-xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.01] rounded-full blur-[100px]" />
             <div className="relative z-10 block mb-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-amber-500/60" />
                    </div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{title}</h3>
                </div>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] ml-11">{sub}</p>
             </div>
             <div className="relative z-10">{children}</div>
        </div>
    );
}

function Loader() {
    return (
        <div className="relative w-12 h-12">
            <Activity className="w-12 h-12 text-amber-500 animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            </div>
        </div>
    );
}
