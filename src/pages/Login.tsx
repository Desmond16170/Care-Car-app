import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import PasswordRecoveryModal from '../components/PasswordRecoveryModal';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';
import { supabase } from '../services/supabaseClient';
import { hydrateCloudState } from '../services/cloudSync';

const Login = () => {
  const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    try {
      await hydrateCloudState();
      navigate('/');
    } catch {
      setError('La sesión inició, pero no se pudieron descargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) return <Register onBack={() => setShowRegister(false)} />;

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <img
        src={localStorage.getItem('car-care-logo') || '/logo-taller.png'}
        alt="Logo Taller"
        style={{ width: '120px', marginBottom: '1rem' }}
      />
      <h2>Bienvenido</h2>
      <p>Ingresa con la misma cuenta en todos tus dispositivos.</p>

      <form onSubmit={handleLogin} style={{ maxWidth: '300px', margin: 'auto' }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
        <ThemedButton type="submit" disabled={loading} style={{ marginTop: '1rem', minWidth: 160 }}>
          {loading ? 'INGRESANDO...' : 'INGRESAR'}
        </ThemedButton>
      </form>

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      <p style={{ marginTop: '1rem' }}>
        <TextButton onClick={() => setShowRecovery(true)}>¿Olvidó su contraseña?</TextButton>
      </p>
      {isElectron && (
        <p>
          <TextButton onClick={() => setShowRegister(true)}>Registrar empresa</TextButton>
        </p>
      )}

      {showRecovery && <PasswordRecoveryModal onClose={() => setShowRecovery(false)} />}
    </div>
  );
};

export default Login;
