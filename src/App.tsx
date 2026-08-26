import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedInstall from './components/ProtectedInstall';
import AppShell from './components/AppShell';
import RequireAuth from './auth/RequireAuth';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import AddVehicle from './pages/AddVehicle';
import SearchVehicles from './pages/SearchVehicles';
import VehicleDetails from './pages/VehicleDetails';
import InitialSetup from './pages/InitialSetup';
import GuideAddVehicle from './pages/GuideAddVehicle';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import ResetPassword from './pages/ResetPassword';

const StartRoute = () => {
  const configured = localStorage.getItem('car-care-configured') === 'true';
  return <Navigate to={configured ? '/home' : '/setup'} replace />;
};

const PublicLogin = () => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading__mark">CC</div>
        <h1>Car Care</h1>
        <p>Preparando acceso…</p>
      </main>
    );
  }
  return session ? <StartRoute /> : <Login />;
};

const App = () => (
  <ProtectedInstall>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<RequireAuth />}>
          <Route index element={<StartRoute />} />
          <Route path="/setup" element={<InitialSetup />} />

          <Route element={<AppShell />}>
            <Route path="/home" element={<Home />} />
            <Route path="/1" element={<Navigate to="/home" replace />} />
            <Route path="/search" element={<SearchVehicles />} />
            <Route path="/add-vehicle" element={<AddVehicle />} />
            <Route path="/add-vehicle-guided" element={<GuideAddVehicle />} />
            <Route path="/vehicle/:plate" element={<VehicleDetails />} />
            <Route path="/resumen" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </ProtectedInstall>
);

export default App;
