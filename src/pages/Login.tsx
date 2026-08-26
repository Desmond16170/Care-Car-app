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
    <section className="cc-auth-page">
      <div className="cc-auth-card">
        <div className="cc-auth-brand">
          <div className="cc-auth-logo">
            <img src={localStorage.getItem('car-care-logo') || '/logo-taller.png'} alt="Care Car" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span>CC</span>
          </div>
          <div>
            <div className="cc-hero-kicker">Care Car 2.0</div>
            <h1>Bienvenido</h1>
            <p>Entra al taller y continúa donde lo dejaste desde cualquier dispositivo.</p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="cc-alert cc-alert-info">Modo de prueba: falta configurar la conexión con Supabase.</div>
        )}

        <form onSubmit={handleLogin} className="cc-auth-form">
          <label className="cc-field">
            <span>Correo electrónico</span>
            <input className="cc-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="nombre@correo.com" required />
          </label>
          <label className="cc-field">
            <span>Contraseña</span>
            <input className="cc-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Tu contraseña" required />
          </label>

          <div className="cc-auth-helper-row">
            <span />
            <TextButton onClick={() => navigate('/forgot-password')}>¿Olvidaste tu contraseña?</TextButton>
          </div>

          {error && <div className="cc-alert cc-alert-danger">{error}</div>}

          <ThemedButton type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </ThemedButton>
        </form>

        <div className="cc-auth-divider"><span>o</span></div>

        <div className="cc-auth-secondary">
          <span>¿Es la primera vez que usas Care Car?</span>
          <TextButton onClick={() => setShowRegister(true)}>Crear una cuenta</TextButton>
        </div>
      </div>
    </section>
  );
};

export default Login;
