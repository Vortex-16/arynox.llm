import { useState } from 'react';
import { Building2, GraduationCap, UserCheck, ShieldCheck, Sparkles, BookOpen, MessageSquare, Lock, BarChart2 } from 'lucide-react';

export default function UserGuide() {
  const [activeRole, setActiveRole] = useState<'student' | 'faculty' | 'admin'>('student');

  return (
    <section className="w-full bg-[#FF5458] text-[#F9E95C] py-16 px-6 md:px-12 flex flex-col items-center relative overflow-hidden">
      {/* Header Badge & Title */}
      <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-black/20 border border-[#F9E95C]/30 text-sm font-bold text-[#F9E95C] mb-6 backdrop-blur-md">
        <Sparkles className="w-4 h-4 text-[#F9E95C]" />
        <span>Platform Guide & Onboarding</span>
      </div>

      <h2 className="text-3xl md:text-5xl font-extrabold text-center tracking-tight mb-4 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>
        How <span className="text-white">arynox.llm</span> Works for Your Campus
      </h2>
      <p className="text-white/90 text-center max-w-2xl mb-10 text-base md:text-lg font-medium">
        An AI-powered Socratic RAG ecosystem preserving academic integrity while delivering 24/7 intelligent tutoring.
      </p>

      {/* Role Navigation Tabs */}
      <div className="flex bg-black/20 border border-[#F9E95C]/30 p-1.5 rounded-full mb-12 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setActiveRole('student')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all text-sm ${
            activeRole === 'student' ? 'bg-[#F9E95C] text-[#FF5458] shadow-lg scale-[1.03]' : 'text-white/80 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>For Students</span>
        </button>

        <button
          onClick={() => setActiveRole('faculty')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all text-sm ${
            activeRole === 'faculty' ? 'bg-[#F9E95C] text-[#FF5458] shadow-lg scale-[1.03]' : 'text-white/80 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>For Faculty</span>
        </button>

        <button
          onClick={() => setActiveRole('admin')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all text-sm ${
            activeRole === 'admin' ? 'bg-[#F9E95C] text-[#FF5458] shadow-lg scale-[1.03]' : 'text-white/80 hover:text-white'
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
            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>1. Interactive Socratic Tutor</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Ask questions about your registered course materials. The AI guides you step-by-step with hints, preventing direct copy-pasting.
              </p>
            </div>

            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>2. Exact Source Citations</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Every answer references the uploaded textbook page or lecture slide number so you can verify answers instantly.
              </p>
            </div>

            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>3. Exam Mode Ready</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                When Exam Mode is toggled by teachers, the AI strictly provides hints and guiding questions only—no solution reveals.
              </p>
            </div>
          </>
        )}

        {activeRole === 'faculty' && (
          <>
            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>1. Upload Course Materials</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Upload syllabus PDFs, lecture notes, or assignments tagged to specific subjects, semesters, and chapters.
              </p>
            </div>

            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>2. Pedagogical AI Controls</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Toggle Exam Mode on or off for your department and set strictness levels to ensure academic integrity.
              </p>
            </div>

            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>3. Student Confusion Heatmaps</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Identify trending student doubts and un-answered topics before exams to adjust your teaching plan.
              </p>
            </div>
          </>
        )}

        {activeRole === 'admin' && (
          <>
            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>1. Dynamic Academic Hierarchy</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Create and manage departments (CSE, ECE, Mech), degree programs (B.Tech, M.Tech), and semester rosters.
              </p>
            </div>

            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>2. Subject & Faculty Registry</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Assign teachers to specific course subjects and manage user promotions across semesters seamlessly.
              </p>
            </div>

            <div className="bg-black/20 border border-[#F9E95C]/30 rounded-3xl p-8 hover:bg-black/30 transition-all group backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-[#F9E95C] text-[#FF5458] flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold mb-3 text-[#F9E95C]" style={{ fontFamily: "'Gabarito', sans-serif" }}>3. Campus Overview Analytics</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                Monitor system-wide RAG usage, query volumes, active student counts, and overall platform engagement.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
