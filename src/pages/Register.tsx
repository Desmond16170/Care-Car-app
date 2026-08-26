import React, { useState } from 'react';
import { authRedirectUrl } from '../auth/redirects';
import { supabase } from '../services/supabaseClient';

const Register = ({ onBack }: { onBack?: () => void }) => {
  const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';
  const [identification, setIdentification] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setIsError(false);
    if (password !== confirmation) {
      setMessage('Las contraseñas no coinciden.');
      setIsError(true);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: authRedirectUrl('login'),
        data: { full_name: name.trim(), identification: identification.trim() },
      },
    });

    if (error) {
      setMessage(error.message.toLowerCase().includes('already')
        ? 'Este correo ya está registrado.'
        : 'No pudimos crear la cuenta. Revisa los datos e intenta nuevamente.');
      setIsError(true);
    } else {
      setMessage(data.session
        ? 'Cuenta creada correctamente. Ya puedes continuar.'
        : 'Cuenta creada. Revisa tu correo y confirma el enlace antes de ingresar.');
    }
    setLoading(false);
  };

  if (!isElectron) {
    return (
      <main className="auth-page auth-page--compact"><section className="auth-panel"><div className="auth-card">
        <p className="eyebrow">REGISTRO PROTEGIDO</p><h2>Registra tu empresa en Windows</h2>
        <p>La cuenta inicial debe crearse desde una instalación autorizada de Car Care.</p>
        <button className="primary-action" onClick={onBack || (() => history.back())}>Volver</button>
      </div></section></main>
    );
  }

  return (
    <main className="auth-page auth-page--compact"><section className="auth-panel">
      <div className="auth-card auth-card--wide">
        <button className="back-action" type="button" onClick={onBack || (() => history.back())}>← Volver</button>
        <div className="auth-card__heading"><p className="eyebrow">NUEVA EMPRESA</p><h2>Crea la cuenta principal</h2>
          <p>Esta cuenta administrará la información sincronizada del taller.</p></div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__grid">
            <div className="field-group"><label htmlFor="register-name">Nombre del responsable</label>
              <input id="register-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field-group"><label htmlFor="register-id">Identificación</label>
              <input id="register-id" value={identification} onChange={(e) => setIdentification(e.target.value)} required /></div>
          </div>
          <div className="field-group"><label htmlFor="register-email">Correo electrónico</label>
            <input id="register-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="auth-form__grid">
            <div className="field-group"><label htmlFor="register-password">Contraseña</label>
              <input id="register-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <small>Mínimo 8 caracteres.</small></div>
            <div className="field-group"><label htmlFor="register-confirmation">Confirmar contraseña</label>
              <input id="register-confirmation" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required /></div>
          </div>
          {message && <div className={isError ? 'form-error' : 'form-success'} role="status">{message}</div>}
          <button className="primary-action" type="submit" disabled={loading}>{loading ? 'Creando cuenta…' : 'Crear cuenta de empresa'}</button>
        </form>
      </div>
    </section></main>
  );
};

export default Register;
