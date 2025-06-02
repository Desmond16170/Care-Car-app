import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';

const Home = () => {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const navigate = useNavigate();
  const [tallerName, setTallerName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('car-care-taller-name');
    if (name) setTallerName(name);
  }, []);
  useEffect(() => {
    const activeUser = JSON.parse(localStorage.getItem('car-care-active-user') || 'null');
    if (!activeUser) {
      navigate('/login');
    } else {
      setUser(activeUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('car-care-active-user');
    navigate('/login');
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <img
        src={localStorage.getItem('car-care-logo') || '/logo-taller.png'}
        alt="Logo Taller"
        style={{ width: '100px', marginBottom: '1rem' }}
      />
      <h1>Bienvenido a {tallerName}</h1>
      <p>Gestión de vehículos y mantenimiento</p>
      <h2 style={{ fontSize: '24px' }}>
        ¡Bienvenido{user ? `, ${user.name}` : ''}!
      </h2>
      <p>Selecciona una opción en el menú para continuar.</p>

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
