import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import InterviewModule from './pages/InterviewModule';
import InterviewDashboard from './pages/InterviewDashboard';
import CareerResources from './pages/CareerResources';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SearchPage from './pages/SearchPage';
import ChatInterface from './pages/ChatInterface';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;

  const isPublicAuthRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname)
    || location.pathname.startsWith('/reset-password/');

  return (
    <div className={`min-h-screen flex flex-col w-full ${isPublicAuthRoute ? 'bg-transparent' : 'bg-slate-50'}`}>
      {user && <Navbar />}
      <main className={isPublicAuthRoute ? 'flex-grow w-full' : 'flex-grow w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password/:token" element={!user ? <ResetPassword /> : <Navigate to="/" />} />

          <Route path="/" element={
            <PrivateRoute>
              {user?.role === 'admin' ? <AdminDashboard /> : <Feed />}
            </PrivateRoute>
          } />

          <Route path="/search" element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          } />

          <Route path="/chat" element={
            <PrivateRoute>
              <ChatInterface />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/profile/:id" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/resources" element={
            <PrivateRoute>
              <CareerResources />
            </PrivateRoute>
          } />

          <Route path="/interviews" element={
            <PrivateRoute>
              <InterviewModule />
            </PrivateRoute>
          } />

          <Route path="/interviews/dashboard" element={
            <PrivateRoute>
              <InterviewDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute roleRequired="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />

        </Routes>
      </main>
    </div>
  );
}

export default App;
