import { useState } from 'react';
import { Building2, GraduationCap, UserCheck, ShieldCheck, Sparkles, BookOpen, MessageSquare, Lock, BarChart2 } from 'lucide-react';

export default function UserGuide() {
  const [activeRole, setActiveRole] = useState<'student' | 'faculty' | 'admin'>('student');

  return (
    <section className="w-full bg-[#121212] text-white py-20 px-6 md:px-12 flex flex-col items-center relative overflow-hidden border-t border-white/10">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF5458]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F9E95C]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge & Title */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-[#F9E95C] mb-4">
        <Sparkles className="w-4 h-4 text-[#F9E95C]" />
        <span>Platform Guide & Onboarding</span>
      </div>

      <h2 className="text-3xl md:text-5xl font-extrabold text-center tracking-tight mb-4" style={{ fontFamily: "'Gabarito', sans-serif" }}>
        How <span className="text-[#FF5458]">arynox.llm</span> Works for Your Campus
      </h2>
      <p className="text-white/60 text-center max-w-2xl mb-12 text-base md:text-lg">
        An AI-powered Socratic RAG ecosystem preserving academic integrity while delivering 24/7 intelligent tutoring.
      </p>

      {/* Role Navigation Tabs */}
      <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl mb-12 shadow-2xl backdrop-blur-xl">
        <button
          onClick={() => setActiveRole('student')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm ${
            activeRole === 'student' ? 'bg-[#FF5458] text-white shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>For Students</span>
        </button>

        <button
          onClick={() => setActiveRole('faculty')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm ${
            activeRole === 'faculty' ? 'bg-[#FF5458] text-white shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>For Faculty</span>
        </button>

        <button
          onClick={() => setActiveRole('admin')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm ${
            activeRole === 'admin' ? 'bg-[#FF5458] text-white shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>For University Admin</span>
        </button>
      </div>

      {/* Content Cards Grid based on selected Role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {activeRole === 'student' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#FF5458]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#FF5458]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-[#FF5458]" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Interactive Socratic Tutor</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Ask questions about your registered course materials. The AI guides you step-by-step with hints, preventing direct copy-pasting.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#F9E95C]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#F9E95C]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-[#F9E95C]" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Exact Source Citations</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Every answer references the uploaded textbook page or lecture slide number so you can verify answers instantly.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Exam Mode Ready</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                When Exam Mode is toggled by teachers, the AI strictly provides hints and guiding questions only—no solution reveals.
              </p>
            </div>
          </>
        )}

        {activeRole === 'faculty' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#FF5458]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#FF5458]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-[#FF5458]" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Upload Course Materials</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Upload syllabus PDFs, lecture notes, or assignments tagged to specific subjects, semesters, and chapters.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-400/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Pedagogical AI Controls</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Toggle Exam Mode on or off for your department and set strictness levels to ensure academic integrity.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart2 className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Student Confusion Heatmaps</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Identify trending student doubts and un-answered topics before exams to adjust your teaching plan.
              </p>
            </div>
          </>
        )}

        {activeRole === 'admin' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#FF5458]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#FF5458]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-[#FF5458]" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Dynamic Academic Hierarchy</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Create and manage departments (CSE, ECE, Mech), degree programs (B.Tech, M.Tech), and semester rosters.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#F9E95C]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#F9E95C]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6 text-[#F9E95C]" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Subject & Faculty Registry</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Assign teachers to specific course subjects and manage user promotions across semesters seamlessly.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Campus Overview Analytics</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Monitor system-wide RAG usage, query volumes, active student counts, and overall platform engagement.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
