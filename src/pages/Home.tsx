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

    loadUser();

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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>Care Car 2.0</h1>
        <p>La interfaz está funcionando, pero falta conectar este build con Supabase.</p>
        <ThemedButton onClick={() => navigate('/login')}>Ir al inicio de sesión</ThemedButton>
      </div>
    );
  }

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando sesión...</p>;
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <img
        src={localStorage.getItem('car-care-logo') || '/logo-taller.png'}
        alt="Logo Care Car"
        style={{ width: '100px', marginBottom: '1rem' }}
      />
      <h1>Bienvenido a {tallerName}</h1>
      <p>Gestión de vehículos y mantenimiento</p>
      <h2 style={{ fontSize: '24px' }}>¡Bienvenido, {userName}!</h2>
      <p>Tu sesión ahora se gestiona con Supabase Auth.</p>

      <ThemedButton
        onClick={handleLogout}
        style={{ marginTop: '2rem', padding: '10px 24px', width: 'auto', minWidth: '160px' }}
      >
        Cerrar sesión
      </ThemedButton>
    </div>
  );
};

export default Home;
