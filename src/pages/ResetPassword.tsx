import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';
import { supabase } from '../lib/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (password.length < 8) {
      setIsError(true);
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    if (!supabase) {
      setIsError(true);
      setMessage('Supabase todavía no está configurado en esta instalación.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage('El enlace de recuperación no es válido o ya venció. Solicita uno nuevo.');
      return;
    }

    setMessage('Contraseña actualizada correctamente. Ya puedes volver al taller.');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <section className="cc-auth-page">
      <div className="cc-auth-card">
        <div className="cc-auth-brand">
          <div className="cc-auth-logo"><span>CC</span></div>
          <div>
            <div className="cc-hero-kicker">Nueva contraseña</div>
            <h1>Restablecer contraseña</h1>
            <p>Elige una nueva contraseña para tu cuenta de Care Car.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="cc-auth-form">
          <label className="cc-field">
            <span>Nueva contraseña</span>
            <input className="cc-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          </label>
          <label className="cc-field">
            <span>Confirmar contraseña</span>
            <input className="cc-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          </label>

          {message && <div className={isError ? 'cc-alert cc-alert-danger' : 'cc-alert cc-alert-info'}>{message}</div>}

          <ThemedButton type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </ThemedButton>
        </form>

        <div className="cc-auth-secondary">
          <TextButton onClick={() => navigate('/login')}>Volver a iniciar sesión</TextButton>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
