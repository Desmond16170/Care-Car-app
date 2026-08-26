import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import PasswordRecoveryModal from '../components/PasswordRecoveryModal';
import { supabase } from '../services/supabaseClient';
import { hydrateCloudState } from '../services/cloudSync';

const Login = () => {
  const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (authError) {
      setError('No pudimos iniciar sesión. Revisa el correo y la contraseña.');
      setLoading(false);
      return;
    }

    try {
      await hydrateCloudState();
      navigate('/', { replace: true });
    } catch {
      setError('La sesión inició, pero no se pudieron descargar los datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) return <Register onBack={() => setShowRegister(false)} />;

  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="Car Care">
        <div className="auth-hero__content">
          <span className="auth-brand-mark">CC</span>
          <p className="eyebrow">GESTIÓN PARA TALLERES</p>
          <h1>Tu taller, organizado desde cualquier lugar.</h1>
          <p>Clientes, vehículos y trabajos sincronizados entre la aplicación de Windows y la PWA.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="auth-mobile-mark">CC</span>
            <p className="eyebrow">ACCESO SEGURO</p>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa con la cuenta de tu empresa.</p>
          </div>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="field-group">
              <label htmlFor="login-email">Correo electrónico</label>
              <input id="login-email" type="email" autoComplete="email" value={email}
                onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="login-password">Contraseña</label>
                <button type="button" className="text-action" onClick={() => setShowRecovery(true)}>¿La olvidaste?</button>
              </div>
              <div className="password-field">
                <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-action" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
          </form>
          {isElectron ? (
            <p className="auth-card__footer">¿Primera instalación?{' '}
              <button className="text-action" onClick={() => setShowRegister(true)}>Registrar empresa</button>
            </p>
          ) : (
            <p className="auth-card__notice">Las cuentas nuevas se registran desde una instalación de Windows con licencia.</p>
          )}
        </div>
      </section>
      {showRecovery && <PasswordRecoveryModal initialEmail={email} onClose={() => setShowRecovery(false)} />}
    </main>
  );
};

export default Login;
