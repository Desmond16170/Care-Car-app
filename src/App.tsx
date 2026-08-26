import React, { useEffect, useMemo, useState } from 'react';
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
import Recepciones from './pages/Recepciones';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Settings from './pages/Settings';
import ProtectedInstall from './components/ProtectedInstall';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import InitialSetup from './pages/InitialSetup';
import GuideAddVehicle from './pages/GuideAddVehicle';
import { getModuleConfig, ModuleConfig, ModuleKey } from './lib/modules';

const ModuleGuard: React.FC<{ module: ModuleKey; modules: ModuleConfig; children: React.ReactElement }> = ({ module, modules, children }) => {
  if (!modules[module]) return <Navigate to="/1" replace />;
  return children;
};

const AppRoutes: React.FC<{ modules: ModuleConfig }> = ({ modules }) => (
  <Routes>
    <Route path="/" element={<Navigate to="/1" replace />} />
    <Route path="/1" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/setup" element={<InitialSetup />} />
    <Route path="/dashboard" element={<ModuleGuard module="dashboard" modules={modules}><Dashboard /></ModuleGuard>} />
    <Route path="/search" element={<SearchVehicles />} />
    <Route path="/tramado" element={<ModuleGuard module="tramado" modules={modules}><Tramado /></ModuleGuard>} />
    <Route path="/recepciones" element={<ModuleGuard module="tramado" modules={modules}><Recepciones /></ModuleGuard>} />
    <Route path="/customers" element={<ModuleGuard module="customers" modules={modules}><Customers /></ModuleGuard>} />
    <Route path="/customers/:id" element={<ModuleGuard module="customers" modules={modules}><CustomerDetails /></ModuleGuard>} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/add-vehicle" element={<AddVehicle />} />
    <Route path="/add-vehicle-guided" element={<GuideAddVehicle />} />
    <Route path="/vehicle/:plate" element={<VehicleDetails />} />
    <Route path="*" element={<Navigate to="/1" replace />} />
  </Routes>
);

const App = () => {
  const location = useLocation();
  const [modules, setModules] = useState<ModuleConfig>(getModuleConfig());
  const tallerName = localStorage.getItem('car-care-taller-name') || 'Care Car';
  const logo = localStorage.getItem('car-care-logo');
  const isAuthView = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'].includes(location.pathname);

  useEffect(() => {
    const refresh = () => setModules(getModuleConfig());
    window.addEventListener('car-care-modules-changed', refresh as EventListener);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('car-care-modules-changed', refresh as EventListener);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const coreNavItems = useMemo(() => {
    const items = [
      { to: '/1', label: 'Inicio', enabled: true },
      { to: '/dashboard', label: 'Resumen', enabled: modules.dashboard },
      { to: '/search', label: 'Vehículos', enabled: true },
      { to: '/customers', label: 'Clientes', enabled: modules.customers },
      { to: '/tramado', label: 'Tramado', enabled: modules.tramado },
      { to: '/add-vehicle-guided', label: 'Agregar', enabled: true },
    ];
    return items.filter(item => item.enabled);
  }, [modules]);

  if (isAuthView) {
    return <ProtectedInstall><div className="cc-auth-root"><AppRoutes modules={modules} /></div></ProtectedInstall>;
  }

  return (
    <ProtectedInstall>
      <div className="cc-app-shell">
        <header className="cc-topbar">
          <div className="cc-topbar-inner">
            <div className="cc-brand">
              <div className="cc-brand-mark">{logo ? <img src={logo} alt="Logo" /> : 'CC'}</div>
              <div className="cc-brand-copy"><h1 className="cc-brand-title">{tallerName}</h1><p className="cc-brand-subtitle">Gestión de vehículos y mantenimiento</p></div>
            </div>

            <nav className="cc-desktop-nav" aria-label="Navegación principal">
              {coreNavItems.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`}>{item.label}</NavLink>)}
              {modules.tramado && <NavLink to="/recepciones" className={({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`}>Recepciones</NavLink>}
              <NavLink to="/settings" className={({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`}>Configuración</NavLink>
            </nav>

            <NavLink to="/settings" className="cc-mobile-settings-link">Config.</NavLink>
          </div>
        </header>

        <main className="cc-main"><AppRoutes modules={modules} /></main>

        <nav className="cc-bottom-nav" aria-label="Navegación móvil">
          {coreNavItems.slice(0, 5).map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `cc-bottom-link${isActive ? ' active' : ''}`}>{item.label}</NavLink>)}
        </nav>

        <PWAInstallPrompt />
      </div>
    </ProtectedInstall>
  );
};

export default App;
