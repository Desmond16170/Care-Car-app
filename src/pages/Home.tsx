import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { supabase } from '../lib/supabase';

const Home = () => {
  const [userName, setUserName] = useState('');
  const [tallerName, setTallerName] = useState('Care Car');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem('car-care-taller-name');
    if (name) setTallerName(name);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        navigate('/login', { replace: true });
        return;
      }

      const name =
        data.user.user_metadata?.full_name ||
        data.user.email ||
        'Usuario';

      setUserName(name);
      setLoading(false);
    };

    void loadUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate('/login', { replace: true });
  };

  if (!supabase) {
    return (
      <section className="cc-page">
        <div className="cc-card cc-empty">
          <h1>Care Car 2.0</h1>
          <p>La interfaz está funcionando, pero falta conectar este build con Supabase.</p>
          <ThemedButton onClick={() => navigate('/login')} style={{ width: 'auto', margin: '1rem auto 0' }}>
            Ir al inicio de sesión
          </ThemedButton>
        </div>
      </section>
    );
  }

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando sesión...</p>;
  }

  return (
    <section className="cc-page">
      <div className="cc-card cc-hero">
        <div>
          <div className="cc-hero-kicker">Panel de trabajo</div>
          <h1 className="cc-hero-title">{tallerName}</h1>
          <p className="cc-hero-copy">
            Registra vehículos, consulta historiales y agrega mantenimientos sin perder tiempo entre pantallas.
          </p>
        </div>
        <div className="cc-user-chip">{userName}</div>
      </div>

      <div className="cc-grid cc-action-grid">
        <button className="cc-action-card" onClick={() => navigate('/search')}>
          <span className="cc-action-label">Buscar</span>
          <div>
            <h2 className="cc-action-title">Abrir un vehículo</h2>
            <p className="cc-action-copy">Encuentra por placa, marca, modelo, VIN o apodo.</p>
          </div>
        </button>

        <button className="cc-action-card" onClick={() => navigate('/add-vehicle-guided')}>
          <span className="cc-action-label">Nuevo</span>
          <div>
            <h2 className="cc-action-title">Registrar vehículo</h2>
            <p className="cc-action-copy">Empieza por marca y modelo o usa el registro manual.</p>
          </div>
        </button>

        <button className="cc-action-card" onClick={() => navigate('/dashboard')}>
          <span className="cc-action-label">Resumen</span>
          <div>
            <h2 className="cc-action-title">Ver actividad</h2>
            <p className="cc-action-copy">Revisa vehículos, mantenimientos y cambios de aceite.</p>
          </div>
        </button>
      </div>

      <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
        <ThemedButton
          onClick={handleLogout}
          style={{ width: 'auto', minWidth: '150px', backgroundColor: '#ffffff', color: '#4f5a65', border: '1px solid #dfe4e8' }}
        >
          Cerrar sesión
        </ThemedButton>
      </div>
    </section>
  );
};

export default Home;
