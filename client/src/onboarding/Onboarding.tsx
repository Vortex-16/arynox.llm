import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, GraduationCap, Users, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { user, login, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role) {
      setFormData(prev => ({ ...prev, role: user.role }));
    }
  }, [user]);

  const [formData, setFormData] = useState({
    role: 'student',
    department: 'CSE',
    className: '1st Year',
    semester: 'Sem 1',
    subjects: [] as string[],
    semesters: [] as string[],
    classYears: [] as string[],
  });

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        login(data.user, data.token);
        navigate(data.user.role === 'teacher' ? '/teacher' : '/student');
      } else {
        alert(data.message || 'Onboarding failed');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center p-6 selection:bg-amber-500/30 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-2xl bg-[#111] border border-white/5 rounded-[32px] p-8 md:p-12 relative z-10 shadow-2xl">
        
        <div className="flex items-center gap-3 mb-10">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-amber-500' : 'w-4 bg-white/10'}`}></div>
          ))}
          <span className="text-xs font-medium text-white/30 ml-2">Step {step} of 2</span>
        </div>

        {step === 1 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-bold mb-3 tracking-tight">Welcome, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-white/50 text-lg mb-10">To personalize your experience, tell us your role at the institution.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleRoleSelect('student')}
                className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500 group-hover:scale-110 transition-transform duration-500">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">I am a Student</h3>
                <p className="text-sm text-white/40 leading-relaxed">Access notes, AI summaries, immersive study tools, and track your progress.</p>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <ArrowRight className="w-5 h-5 text-amber-500" />
                </div>
              </button>

              <button 
                onClick={() => handleRoleSelect('teacher')}
                className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 text-violet-500 group-hover:scale-110 transition-transform duration-500">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">I am a Faculty</h3>
                <p className="text-sm text-white/40 leading-relaxed">Upload course materials, manage student queries, and monitor class performance.</p>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <ArrowRight className="w-5 h-5 text-violet-500" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-white/40 hover:text-white mb-6 text-sm transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to role selection
            </button>
            
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Complete your profile</h1>
            <p className="text-white/50 mb-8">Tell us which classes and subjects you belong to.</p>

            <div className="space-y-6">
              
              <div>
                <label className="block text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors appearance-none"
                >
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="MECH">Mechanical (MECH)</option>
                </select>
              </div>

              {formData.role === 'student' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Class / Year</label>
                    <select 
                      value={formData.className}
                      onChange={(e) => setFormData({...formData, className: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Current Semester</label>
                    <select 
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors"
                    >
                      {['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <p className="text-xs text-white/40 italic">Note: These details help us route notes to students. You can always change them later.</p>
                   <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-500 mb-1">Teaching Profile Ready</h4>
                          <p className="text-sm text-white/50">Your department is set to <span className="text-white">{formData.department}</span>. You can define specific chapters and semesters for every document you upload.</p>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-[#111] font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-[#111]/30 border-t-[#111] animate-spin rounded-full"></div> : "Complete Onboarding"}
                {!loading && <CheckCircle2 className="w-5 h-5" />}
              </button>

            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <BrainCircuit className="w-5 h-5 text-amber-500" />
             <span className="text-sm font-bold tracking-widest text-white/30">ARYNOX.LLM</span>
          </div>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Secure Academic Portal</p>
        </div>

      </div>
    </div>
  );
}
