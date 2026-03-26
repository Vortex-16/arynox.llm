import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './login/login_page/src/App'
import SignUpPage from './login/sign_up/src/App'
import WaterRipple from './components/WaterRipple'
import TeacherDashboard from './teacher/teacher_dashboard'
import StudentDashboard from './student/student_dashboard'
import Notebook from './student/notebook'

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
            lightColor="#F0E0E0"
            speed={0.8}
            bgColor="#FF5458"
            text="arynox.llm"
            textColor="#F0E0E0"
            rotationIntensity={0.2}
          />

          {/* Navigation Links (floats above the ripple canvas) */}
          <nav className="absolute top-8 right-8 flex items-center gap-6 z-20">
            <Link 
              to="/teacher" 
              className="text-[#F0E0E0]/80 hover:text-white transition-colors font-medium text-sm"
            >
              Teacher Hub
            </Link>
            <Link 
              to="/student" 
              className="text-[#F0E0E0]/80 hover:text-white transition-colors font-medium text-sm"
            >
              Student Chat
            </Link>
            <div className="flex items-center gap-3 ml-2">
                <Link 
                  to="/login" 
                  className="px-5 py-2 rounded-full border border-[#F0E0E0]/30 text-[#F0E0E0] hover:bg-[#F0E0E0] hover:text-[#FF5458] transition-all font-semibold text-sm"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-5 py-2 rounded-full bg-[#F0E0E0] text-[#FF5458] shadow-sm hover:bg-white hover:scale-[1.02] transition-all font-semibold text-sm"
                >
                  Sign Up
                </Link>
            </div>
          </nav>
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
