import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './login/login_page/src/App'
import SignUpPage from './login/sign_up/src/App'
import WaterRipple from './components/WaterRipple'
import TeacherDashboard from './teacher/teacher_dashboard'
import StudentDashboard from './student/student_dashboard'
import Notebook from './student/notebook'
import logoSvg from './assets/logo.svg'
import Features from './components/Features'
import TeamMembers from './components/TeamMembers'
import CustomCursor from './components/CustomCursor'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
function App() {
  const horizontalRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const [featuresProgress, setFeaturesProgress] = useState(0);
  const [teamProgress, setTeamProgress] = useState(0);
  const [footerProgress, setFooterProgress] = useState(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Normalize wheel delta for consistency
      const speed = 0.05;
      // Range: 0-1700 (...Team animations 500-1600, Footer vertical 1600-1700)
      targetX.current = Math.max(0, Math.min(1700, targetX.current + e.deltaY * speed));
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useGSAP(() => {
    const tick = () => {
      // Smooth interpolation (lerp)
      const lerpFactor = 0.08;
      currentX.current += (targetX.current - currentX.current) * lerpFactor;
      
      if (sliderRef.current) {
        // Three-phase x position:
        // 0-100:   slides from Hero to Features
        // 100-400: pinned at 100vw (Features internal stacking)
        // 400-500: slides from Features to TeamMembers — then PINNED at 200vw
        let xPos: number;
        if (currentX.current <= 100) {
          xPos = currentX.current;
        } else if (currentX.current <= 400) {
          xPos = 100;
        } else {
          // Cap at 200 so the slider never goes beyond TeamMembers
          xPos = Math.min(200, 100 + (currentX.current - 400));
        }
        gsap.set(sliderRef.current, { x: `-${xPos}vw` });
      }

      // Sync featuresProgress — capped at 300 (max for 4-page stacking)
      const fp = Math.max(0, Math.min(300, currentX.current - 100));
      setFeaturesProgress(prev => Math.abs(prev - fp) > 0.1 ? fp : prev);

      // Sync teamProgress — drives all animations (500-1600 range → 0-1100)
      const tp = Math.max(0, Math.min(1100, currentX.current - 500));
      setTeamProgress(prev => Math.abs(prev - tp) > 0.1 ? tp : prev);

      // Sync footerProgress — footer slides up after team animations (1600-1700 → 0-100)
      const fp2 = Math.max(0, Math.min(100, currentX.current - 1600));
      setFooterProgress(prev => Math.abs(prev - fp2) > 0.1 ? fp2 : prev);
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  });

  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/" element={
          <div ref={horizontalRef} className="relative w-full h-screen overflow-hidden bg-[#FF5458]">
            <div ref={sliderRef} className="flex h-full w-[300vw]">
              
              {/* Slide 1: Hero */}
              <main className="relative w-[100vw] h-full flex flex-col items-center bg-[#FF5458] overflow-hidden shrink-0">
                <div className="hidden lg:block absolute inset-0 w-full h-full">
                  <WaterRipple 
                    strength={0.8}
                    viscosity={0.7}
                    decay={0.8}
                    chromaticDispersion={0.08}
                    lightIntensity={0.85}
                    lightColor="#F9E95C"
                    speed={0.8}
                    bgColor="#FF5458"
                    text="arynox.llm"
                    textColor="#F9E95C"
                    rotationIntensity={0.2}
                  />
                </div>

                {/* Mobile/Tablet Replacement for WaterRipple (matched to WaterRipple.tsx exactly) */}
                <div 
                  className="lg:hidden absolute left-0 right-0 pointer-events-none text-center select-none"
                  style={{ top: '25.2%', transform: 'translateY(-50%)' }}
                >
                  <div 
                    className="text-[#F9E95C] font-extrabold opacity-100"
                    style={{ 
                      fontFamily: "'Gabarito', sans-serif",
                      fontSize: 'clamp(74px, 15vw, 161px)', // Smoothly transition between mobile (74px) and tablet (161px)
                      fontWeight: 800,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    arynox.llm
                  </div>
                </div>
                
                <div 
                  className="absolute z-50 pointer-events-none select-none text-center font-extrabold text-[#F9E95C] 
                             -translate-x-1/2 -translate-y-1/2
                             /* Mobile */    left-[50%] top-[35%] w-[309px] text-[16px] leading-[23px]
                             /* Tablet */    md:left-[50%] md:top-[45%] md:w-[750px] md:text-[38px] md:leading-[50px]
                             /* Desktop */   lg:left-[50%] lg:top-[53%] lg:w-[862px] lg:text-[51px] lg:leading-[55px]"
                >
                  Leverage AI to grow your <br className="hidden md:block lg:hidden" /> knowledge and study immersively.
                </div>
                
                <div 
                  className="absolute z-50 flex items-center gap-4
                             -translate-x-1/2 -translate-y-1/2
                             /* Mobile */    left-[50%] top-[48%]
                             /* Tablet */    md:left-[50%] md:top-[58%]
                             /* Desktop */   lg:left-[50%] lg:top-[66%]"
                >
                  <Link to="/login" className="px-8 py-3 rounded-full border border-[#F9E95C]/30 text-[#F9E95C] hover:bg-[#F9E95C] hover:text-[#FF5458] transition-all font-bold text-[15px] shadow-lg backdrop-blur-sm">Login</Link>
                  <Link to="/signup" className="px-6 py-3 md:px-8 rounded-full bg-[#F9E95C] text-[#FF5458] shadow-xl hover:bg-white hover:scale-[1.05] transition-all font-bold text-[15px] whitespace-nowrap">Sign Up</Link>
                </div>
                
                <div 
                  className="absolute z-50 pointer-events-none flex justify-center
                             -translate-x-1/2
                             /* Mobile */    left-[50%] top-[55%] w-[140px]
                             /* Tablet */    md:left-[50%] md:top-[66%] md:w-[200px]
                             /* Desktop */   lg:left-[50%] lg:top-[74%] lg:w-[260px]"
                >
                  <img src={logoSvg} alt="Logo" className="w-full h-auto opacity-90" />
                </div>
                <div className="grain-overlay hidden lg:block" />
              </main>

              {/* Slide 2: Features */}
              <div className="w-[100vw] h-full shrink-0">
                <Features scrollProgress={featuresProgress} />
              </div>

              {/* Slide 3: Team Members (with footer overlay) */}
              <div className="w-[100vw] h-full shrink-0">
                <TeamMembers scrollProgress={teamProgress} footerProgress={footerProgress} />
              </div>

            </div>
          </div>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/notebook" element={<Notebook />} />
      </Routes>
    </>
  )
}

export default App
