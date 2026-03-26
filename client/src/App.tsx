import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './login/login_page/src/App'
import SignUpPage from './login/sign_up/src/App'
import TeacherDashboard from './teacher/teacher_dashboard'
import StudentDashboard from './student/student_dashboard'
import Notebook from './student/notebook'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="flex flex-col h-screen w-full items-center justify-center text-white bg-[#111]">
          <h1 className="text-4xl font-bold mb-4">Welcome to ARYNOX</h1>
          <div className="flex gap-4 items-center">
            <Link to="/login" className="text-[#7C3AED] hover:underline">Login Page</Link>
            <span className="text-white/30">|</span>
            <Link to="/signup" className="text-[#10B981] hover:underline">Sign Up</Link>
            <span className="text-white/30">|</span>
            <Link to="/teacher" className="text-[#E34234] hover:underline">Teacher Hub</Link>
            <span className="text-white/30">|</span>
            <Link to="/student" className="text-[#F59E0B] hover:underline">Student RAG Chat</Link>
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
