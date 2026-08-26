import React, { useState } from 'react';
import ThemedButton from '../components/ThemedButton';
import PasswordInput from '../components/PasswordInput';
import { supabase } from '../services/supabaseClient';

const Register = ({ onBack }: { onBack?: () => void }) => {
  const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';
  const [identification, setIdentification] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), identification: identification.trim() },
      },
    });

    if (error) {
      setMessage(error.message.includes('already') ? 'Este correo ya está registrado.' : error.message);
    } else if (!data.session) {
      setMessage('Cuenta creada. Revisa tu correo para confirmarla antes de ingresar.');
    } else {
      setMessage('Cuenta creada correctamente. Ya puedes ingresar.');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: 10,
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: 4,
    marginBottom: 10,
  };

  if (!isElectron) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Registro disponible en Windows</h2>
        <p>La cuenta de la empresa debe crearse desde una instalación autorizada de Car Care.</p>
        <ThemedButton onClick={onBack || (() => history.back())}>Volver al inicio de sesión</ThemedButton>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Registrar cuenta de la empresa</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto' }}>
        <input type="text" placeholder="Número de identificación" value={identification}
          onChange={e => setIdentification(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Nombre completo" value={name}
          onChange={e => setName(e.target.value)} required style={inputStyle} />
        <input type="email" placeholder="Correo electrónico" value={email}
          onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <PasswordInput placeholder="Contraseña (mínimo 6 caracteres)" value={password}
          onChange={e => setPassword(e.target.value)} style={inputStyle} />
        <ThemedButton type="submit" disabled={loading} style={{ marginTop: '1rem', minWidth: 160 }}>
          {loading ? 'CREANDO...' : 'CREAR CUENTA'}
        </ThemedButton>
      </form>

      {message && <p style={{ marginTop: 10, fontWeight: 'bold' }}>{message}</p>}
      <ThemedButton onClick={onBack || (() => history.back())} style={{ marginTop: '1rem', minWidth: 160 }}>
        Volver
      </ThemedButton>
    </div>
  );
};

export default Register;
