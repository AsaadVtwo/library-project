import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddBook from './pages/AddBook'
import Users from './pages/Users'
import Loans from './pages/Loans'
import Login from './pages/Login'
import Admins from './pages/Admins'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return children
}

function MainApp() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-cairo">
      {user && (
        <nav className="bg-white shadow-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-indigo-700 leading-none">مكتبة</span>
                    <span className="text-xs font-medium text-slate-500 mt-1">مدرسة ابن خلدون الابتدائية</span>
                  </div>
                </div>
                <div className="hidden sm:mr-10 sm:flex sm:space-x-8 sm:space-x-reverse">
                  <Link to="/" className="border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors duration-200">
                    لوحة التحكم
                  </Link>
                  <Link to="/add" className="border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors duration-200">
                    إضافة كتاب
                  </Link>
                  <Link to="/users" className="border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors duration-200">
                    المستخدمين
                  </Link>
                  <Link to="/loans" className="border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors duration-200">
                    الإعارات
                  </Link>
                  <Link to="/admins" className="border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors duration-200">
                    المدراء
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-800">
                  تسجيل خروج
                </button>
                <button className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all">
                  <span className="sr-only">الإشعارات</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[600px]">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/add" element={<ProtectedRoute><AddBook /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
                <Route path="/admins" element={<ProtectedRoute><Admins /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  )
}

export default App
