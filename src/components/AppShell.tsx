import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { flushCloudState } from '../services/cloudSync';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/home', label: 'Inicio', icon: '⌂' },
  { to: '/search', label: 'Buscar vehículo', icon: '⌕' },
  { to: '/add-vehicle-guided', label: 'Agregar vehículo', icon: '+' },
  { to: '/resumen', label: 'Resumen', icon: '▥' },
  { to: '/settings', label: 'Configuración', icon: '⚙' },
];

const AppShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const tallerName = localStorage.getItem('car-care-taller-name') || 'Car Care';
  const logo = localStorage.getItem('car-care-logo');

  const handleLogout = async () => {
    try {
      await flushCloudState();
    } finally {
      await supabase.auth.signOut();
      localStorage.removeItem('car-care-active-user');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          {logo ? <img src={logo} alt="" className="brand__logo" /> : <span className="brand__mark">CC</span>}
          <div>
            <strong>{tallerName}</strong>
            <small>Gestión del taller</small>
          </div>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen(value => !value)}
        >
          {menuOpen ? 'Cerrar' : 'Menú'}
        </button>

        <div className="account-summary">
          <span>{user?.email}</span>
          <button type="button" className="logout-button" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <div className="app-shell__body">
        <aside id="main-navigation" className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
          <nav aria-label="Navegación principal">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              >
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;

