import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type RegisterProps = {
  onBackToLogin?: () => void;
};

const Register: React.FC<RegisterProps> = ({ onBackToLogin }) => {
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          identification: identification.trim() || null,
        },
      },
    });
    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    if (data.session) {
      navigate('/1', { replace: true });
      return;
    }

    setMessage('Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.');
    setName('');
    setIdentification('');
    setEmail('');
    setPassword('');
  };

  return (
    <section className="cc-auth-page">
      <div className="cc-auth-card cc-auth-card-wide">
        <div className="cc-auth-brand">
          <div className="cc-auth-logo"><span>CC</span></div>
          <div>
            <div className="cc-hero-kicker">Nueva cuenta</div>
            <h1>Crear cuenta</h1>
            <p>Una sola cuenta para Windows, celular, tablet y navegador.</p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="cc-alert cc-alert-info">Modo de prueba: falta configurar la conexión con Supabase.</div>
        )}

        <form onSubmit={handleSubmit} className="cc-auth-form">
          <div className="cc-field-grid">
            <label className="cc-field cc-field-full">
              <span>Nombre completo</span>
              <input className="cc-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la persona" required />
            </label>
            <label className="cc-field">
              <span>Identificación</span>
              <input className="cc-input" type="text" value={identification} onChange={e => setIdentification(e.target.value)} placeholder="Opcional" />
            </label>
            <label className="cc-field">
              <span>Correo electrónico</span>
              <input className="cc-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="nombre@correo.com" required />
            </label>
            <label className="cc-field cc-field-full">
              <span>Contraseña</span>
              <input className="cc-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} placeholder="Mínimo 8 caracteres" required />
              <small className="cc-field-help">Usa una contraseña que no compartas con otras cuentas.</small>
            </label>
          </div>

          {message && (
            <div className={isError ? 'cc-alert cc-alert-danger' : 'cc-alert cc-alert-info'}>{message}</div>
          )}

          <ThemedButton type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </ThemedButton>
        </form>

        <div className="cc-auth-secondary">
          <span>¿Ya tienes una cuenta?</span>
          <TextButton onClick={() => (onBackToLogin ? onBackToLogin() : navigate('/login'))}>Volver a iniciar sesión</TextButton>
        </div>
      </div>
    </section>
  );
};

export default Register;
