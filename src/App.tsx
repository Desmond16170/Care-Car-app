import React from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AddVehicle from './pages/AddVehicle';
import SearchVehicles from './pages/SearchVehicles';
import VehicleDetails from './pages/VehicleDetails';
import Dashboard from './pages/Dashboard';
import ProtectedInstall from './components/ProtectedInstall';
import InitialSetup from './pages/InitialSetup';
import GuideAddVehicle from './pages/GuideAddVehicle';

const navItems = [
  { to: '/1', label: 'Inicio' },
  { to: '/dashboard', label: 'Resumen' },
  { to: '/search', label: 'Vehículos' },
  { to: '/add-vehicle-guided', label: 'Agregar' },
];

const App = () => {
  const tallerName = localStorage.getItem('car-care-taller-name') || 'Care Car';
  const logo = localStorage.getItem('car-care-logo');

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
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `cc-nav-link${isActive ? ' active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="cc-main">
          <Routes>
            <Route path="/" element={<Navigate to="/1" replace />} />
            <Route path="/1" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<InitialSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchVehicles />} />
            <Route path="/add-vehicle" element={<AddVehicle />} />
            <Route path="/add-vehicle-guided" element={<GuideAddVehicle />} />
            <Route path="/vehicle/:plate" element={<VehicleDetails />} />
            <Route path="*" element={<Navigate to="/1" replace />} />
          </Routes>
        </main>

        <nav className="cc-bottom-nav" aria-label="Navegación móvil">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `cc-bottom-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </ProtectedInstall>
  );
};

export default App;
