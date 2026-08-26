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

  const inputStyle: React.CSSProperties = {
    padding: '10px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '10px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial',
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Crear cuenta</h2>
      <p>Esta cuenta será la que sincronice tus datos entre Windows, Android, iPhone y navegador.</p>

      {!isSupabaseConfigured && (
        <p style={{ color: '#b45309', fontWeight: 600 }}>
          Modo de prueba: falta configurar la conexión con Supabase.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: 'auto' }}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Número de identificación (opcional)"
          value={identification}
          onChange={e => setIdentification(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          style={inputStyle}
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
          {loading ? 'CREANDO...' : 'CREAR CUENTA'}
        </ThemedButton>
      </form>

      {message && (
        <p style={{ marginTop: '10px', fontWeight: 'bold', color: isError ? 'red' : 'green' }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: '1rem' }}>
        <TextButton onClick={() => (onBackToLogin ? onBackToLogin() : navigate('/login'))}>
          Volver a iniciar sesión
        </TextButton>
      </p>
    </div>
  );
};

export default Register;
