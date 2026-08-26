import React from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AddVehicle from './pages/AddVehicle';
import SearchVehicles from './pages/SearchVehicles';
import VehicleDetails from './pages/VehicleDetails';
import Dashboard from './pages/Dashboard';
import Tramado from './pages/Tramado';
import Settings from './pages/Settings';
import ProtectedInstall from './components/ProtectedInstall';
import InitialSetup from './pages/InitialSetup';
import GuideAddVehicle from './pages/GuideAddVehicle';

const coreNavItems = [
  { to: '/1', label: 'Inicio' },
  { to: '/dashboard', label: 'Resumen' },
  { to: '/search', label: 'Vehículos' },
  { to: '/tramado', label: 'Tramado' },
  { to: '/add-vehicle-guided', label: 'Agregar' },
];

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/1" replace />} />
    <Route path="/1" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/setup" element={<InitialSetup />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/search" element={<SearchVehicles />} />
    <Route path="/tramado" element={<Tramado />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/add-vehicle" element={<AddVehicle />} />
    <Route path="/add-vehicle-guided" element={<GuideAddVehicle />} />
    <Route path="/vehicle/:plate" element={<VehicleDetails />} />
    <Route path="*" element={<Navigate to="/1" replace />} />
  </Routes>
);

const App = () => {
  const location = useLocation();
  const tallerName = localStorage.getItem('car-care-taller-name') || 'Care Car';
  const logo = localStorage.getItem('car-care-logo');
  const isAuthView = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'].includes(location.pathname);

  if (isAuthView) {
    return (
      <ProtectedInstall>
        <div className="cc-auth-root">
          <AppRoutes />
        </div>
      </ProtectedInstall>
    );
  }

  return (
    <ProtectedInstall>
      <div className="cc-app-shell">
        <header className="cc-topbar">
          <div className="cc-topbar-inner">
            <div className="cc-brand">
              <div className="cc-brand-mark">
                {logo ? <img src={logo} alt="Logo" /> : 'CC'}
              </div>
              <div className="cc-brand-copy">
                <h1 className="cc-brand-title">{tallerName}</h1>
                <p className="cc-brand-subtitle">Gestión de vehículos y mantenimiento</p>
              </div>
            </div>

            <nav className="cc-desktop-nav" aria-label="Navegación principal">
              {coreNavItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`}>
                  {item.label}
                </NavLink>
              ))}
              <NavLink to="/settings" className={({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`}>
                Configuración
              </NavLink>
            </nav>

            <NavLink to="/settings" className="cc-mobile-settings-link">Config.</NavLink>
          </div>
        </header>

        <main className="cc-main">
          <AppRoutes />
        </main>

        <nav className="cc-bottom-nav" aria-label="Navegación móvil">
          {coreNavItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `cc-bottom-link${isActive ? ' active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </ProtectedInstall>
  );
};

export default App;
