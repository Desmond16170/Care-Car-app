import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase todavía no está configurado en esta instalación.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError('No se pudo iniciar sesión. Revisa el correo y la contraseña.');
      return;
    }

    navigate('/1', { replace: true });
  };

  if (showRegister) {
    return <Register onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <img
        src={localStorage.getItem('car-care-logo') || '/logo-taller.png'}
        alt="Logo Care Car"
        style={{ width: '120px', marginBottom: '1rem' }}
      />
      <h2>Bienvenido</h2>
      <p>Inicia sesión para sincronizar tus vehículos entre dispositivos.</p>

      {!isSupabaseConfigured && (
        <p style={{ color: '#b45309', fontWeight: 600 }}>
          Modo de prueba: falta configurar la conexión con Supabase.
        </p>
      )}

      <form onSubmit={handleLogin} style={{ maxWidth: '320px', margin: 'auto' }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />

        <ThemedButton
          type="submit"
          disabled={loading}
          style={{
            marginTop: '1rem',
            padding: '10px 24px',
            width: 'auto',
            minWidth: '160px',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {loading ? 'INGRESANDO...' : 'INGRESAR'}
        </ThemedButton>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      <p style={{ marginTop: '1rem' }}>
        <TextButton onClick={() => setShowRegister(true)}>
          Crear cuenta
        </TextButton>
      </p>
    </div>
  );
};

export default Login;
