import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';
import { supabase } from '../lib/supabase';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!supabase) {
      setIsError(true);
      setMessage('Supabase todavía no está configurado en esta instalación.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage('No se pudo enviar el correo de recuperación. Inténtalo nuevamente.');
      return;
    }

    setMessage('Te enviamos un correo para recuperar tu contraseña.');
  };

  return (
    <section className="cc-auth-page">
      <div className="cc-auth-card">
        <div className="cc-auth-brand">
          <div className="cc-auth-logo"><span>CC</span></div>
          <div>
            <div className="cc-hero-kicker">Recuperar acceso</div>
            <h1>¿Olvidaste tu contraseña?</h1>
            <p>Escribe el correo de tu cuenta y te enviaremos las instrucciones.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="cc-auth-form">
          <label className="cc-field">
            <span>Correo electrónico</span>
            <input className="cc-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="nombre@correo.com" required />
          </label>

          {message && <div className={isError ? 'cc-alert cc-alert-danger' : 'cc-alert cc-alert-info'}>{message}</div>}

          <ThemedButton type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
          </ThemedButton>
        </form>

        <div className="cc-auth-secondary">
          <TextButton onClick={() => navigate('/login')}>Volver a iniciar sesión</TextButton>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
