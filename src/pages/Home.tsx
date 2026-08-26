import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const tallerName = localStorage.getItem('car-care-taller-name') || 'tu taller';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="home-page">
      <section className="welcome-panel">
        <span className="eyebrow">PANEL PRINCIPAL</span>
        <h1>Hola, {displayName}</h1>
        <p>Administra {tallerName} desde un solo lugar.</p>
      </section>

      <section className="quick-actions" aria-label="Acciones rápidas">
        <Link to="/add-vehicle-guided" className="quick-action">
          <span>+</span>
          <strong>Registrar vehículo</strong>
          <small>Agregar un vehículo al taller</small>
        </Link>
        <Link to="/search" className="quick-action">
          <span>⌕</span>
          <strong>Buscar vehículo</strong>
          <small>Consultar perfil e historial</small>
        </Link>
        <Link to="/resumen" className="quick-action">
          <span>▥</span>
          <strong>Ver resumen</strong>
          <small>Actividad y mantenimientos</small>
        </Link>
      </section>
    </div>
  );
};

export default Home;
