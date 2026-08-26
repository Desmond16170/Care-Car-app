import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (password !== confirmation) {
      setIsError(true);
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setIsError(true);
      setMessage('El enlace venció o no es válido. Solicita uno nuevo desde el inicio de sesión.');
    } else {
      setIsError(false);
      setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
      await supabase.auth.signOut();
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    }
    setLoading(false);
  };

  return (
    <main className="auth-page auth-page--compact"><section className="auth-panel">
      <div className="auth-card">
        <p className="eyebrow">NUEVA CONTRASEÑA</p>
        <h2>Protege tu cuenta</h2>
        <p>Escribe una contraseña nueva para volver a ingresar.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group"><label htmlFor="new-password">Nueva contraseña</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <small>Mínimo 8 caracteres.</small></div>
          <div className="field-group"><label htmlFor="new-password-confirmation">Confirmar contraseña</label>
            <input id="new-password-confirmation" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required /></div>
          {message && <div className={isError ? 'form-error' : 'form-success'} role="status">{message}</div>}
          <button className="primary-action" type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar contraseña'}</button>
        </form>
      </div>
    </section></main>
  );
};

export default ResetPassword;
