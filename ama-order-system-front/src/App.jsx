import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MakerDashboard from './pages/MakerDashboard';
import TakerDashboard from './pages/TakerDashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;

  return children;
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'maker' ? '/maker' : '/taker'} />;
};

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/" element={<Layout />}>
              <Route index element={<HomeRedirect />} />

              <Route path="maker" element={
                <ProtectedRoute allowedRole="maker">
                  <MakerDashboard />
                </ProtectedRoute>
              } />

              <Route path="taker" element={
                <ProtectedRoute allowedRole="taker">
                  <TakerDashboard />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;
