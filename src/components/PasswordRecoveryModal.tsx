import React, { useState } from 'react';
import ThemedButton from './ThemedButton';
import { supabase } from '../services/supabaseClient';

const PasswordRecoveryModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecovery = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setMessage(error ? error.message : 'Te enviamos un enlace para restablecer la contraseña.');
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 20 }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 320 }}>
        <h3>Recuperar contraseña</h3>
        <input type="email" placeholder="Correo electrónico" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }} />
        <ThemedButton onClick={handleRecovery} disabled={loading}>
          {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
        </ThemedButton>
        <ThemedButton onClick={onClose} style={{ marginTop: 10 }}>Cerrar</ThemedButton>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;
