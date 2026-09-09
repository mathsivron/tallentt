import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Layout from './components/Layout.jsx'
import Feed from './pages/Feed.jsx'
import ShowroomPage from './pages/ShowroomPage.jsx'
import MyHats from './components/MyHats.jsx'
import HatForm from './components/HatForm.jsx'
import Profile from './pages/Profile.jsx'

function FullPageSpinner() {
  return (
    <div className="min-h-screen grid place-items-center text-gray-500">Loading…</div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/auth" replace />
  return <Layout>{children}</Layout>
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/showroom"
        element={
          <ProtectedRoute>
            <ShowroomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-hats"
        element={
          <ProtectedRoute>
            <MyHats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <HatForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
