import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './login/login_page/src/App'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="flex flex-col h-screen w-full items-center justify-center text-white bg-[#111]">
          <h1 className="text-4xl font-bold mb-4">Welcome to ARYNOX</h1>
          <Link to="/login" className="text-[#7C3AED] hover:underline">Go to Login Page</Link>
        </div>
      } />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
