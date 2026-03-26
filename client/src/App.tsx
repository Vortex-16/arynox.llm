import { useState, useEffect, useRef } from 'react'
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
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
function App() {
  const horizontalRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0); // 0 to 100

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent browser default back/forward gestures if possible, 
      // but mainly stop vertical scroll which doesn't exist anyway.
      const speed = 0.12;
      setScrollX((prev) => {
        const next = prev + e.deltaY * speed;
        return Math.max(0, Math.min(100, next));
      });
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useGSAP(() => {
    gsap.to(sliderRef.current, {
      x: `-${scrollX}vw`,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }, [scrollX]);

  return (
    <Routes>
      <Route path="/" element={
        <div ref={horizontalRef} className="relative w-full h-screen overflow-hidden bg-[#FF5458]">
          <div ref={sliderRef} className="flex h-full w-[200vw]">
            
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
                    letterSpacing: '-0.05em'
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
              <Features />
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
  )
}

export default App
