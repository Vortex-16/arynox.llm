import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './login/login_page/src/App'
import SignUpPage from './login/sign_up/src/App'
import WaterRipple from './components/WaterRipple'
import TeacherDashboard from './teacher/teacher_dashboard'
import StudentDashboard from './student/student_dashboard'
import Notebook from './student/notebook'
import logoSvg from './assets/logo.svg'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <main className="relative w-full h-full flex flex-col items-center overflow-hidden bg-[#FF5458]">
          {/* Water Ripple — renders background + text as a scene, then distorts both */}
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

          {/* Navigation Links (floats above the ripple canvas) */}
          {/* Navigation (Simplified - Login/Sign Up moved to center) */}
          <nav className="absolute top-8 right-8 flex items-center gap-6 z-20">
            {/* Dashboard links hidden for now */}
          </nav>

          {/* New Non-Rippled Text Overlay */}
          <div 
            className="absolute z-50 pointer-events-none select-none text-center font-extrabold text-[#F9E95C] 
                       -translate-x-1/2 -translate-y-1/2
                       /* Mobile */    left-[50%] top-[35%] w-[309px] text-[16px] leading-[23px]
                       /* Tablet */    md:left-[50%] md:top-[45%] md:w-[750px] md:text-[38px] md:leading-[50px]
                       /* Desktop */   lg:left-[50%] lg:top-[53%] lg:w-[862px] lg:text-[51px] lg:leading-[55px]"
          >
            Leverage AI to grow your <br className="hidden md:block lg:hidden" /> knowledge and study immersively.
          </div>

          {/* Centered Auth Buttons */}
          <div 
            className="absolute z-50 flex items-center gap-4
                       -translate-x-1/2 -translate-y-1/2
                       /* Mobile */    left-[50%] top-[48%]
                       /* Tablet */    md:left-[50%] md:top-[58%]
                       /* Desktop */   lg:left-[50%] lg:top-[66%]"
          >
              <Link 
                to="/login" 
                className="px-8 py-3 rounded-full border border-[#F9E95C]/30 text-[#F9E95C] hover:bg-[#F9E95C] hover:text-[#FF5458] transition-all font-bold text-[15px] shadow-lg backdrop-blur-sm"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-6 py-3 md:px-8 rounded-full bg-[#F9E95C] text-[#FF5458] shadow-xl hover:bg-white hover:scale-[1.05] transition-all font-bold text-[15px] whitespace-nowrap"
              >
                Sign Up
              </Link>
          </div>

          {/* Logo below buttons */}
          <div 
            className="absolute z-50 pointer-events-none flex justify-center
                       -translate-x-1/2
                       /* Mobile */    left-[50%] top-[55%] w-[140px]
                       /* Tablet */    md:left-[50%] md:top-[66%] md:w-[200px]
                       /* Desktop */   lg:left-[50%] lg:top-[74%] lg:w-[260px]"
          >
            <img src={logoSvg} alt="Logo" className="w-full h-auto opacity-90" />
          </div>

          <div className="grain-overlay" />
        </main>
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
