import React, { useState } from 'react';
import ThemedButton from './ThemedButton';

const PasswordRecoveryModal = ({ onClose }: { onClose: () => void }) => {
  const [adminKey, setAdminKey] = useState('');
  const [cedula, setCedula] = useState('');
  const [message, setMessage] = useState('');

  const handleRecovery = () => {
    const storedKey = localStorage.getItem('car-care-manager-key');
    if (adminKey !== storedKey) {
      setMessage('Clave de gerente incorrecta');
      return;
    }

    const users = JSON.parse(localStorage.getItem('car-care-users') || '[]');
    const user = users.find((u: any) => u.cedula === cedula);
    if (user) {
      setMessage(`Contraseña de ${user.name}: ${user.password}`);
    } else {
      setMessage('Usuario no encontrado');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#00000088',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '300px' }}>
        <h3>Recuperar contraseña</h3>
        <input
          type="password"
          placeholder="Clave del gerente"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <input
          type="text"
          placeholder="Cédula del usuario"
          value={cedula}
          onChange={e => setCedula(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />

        <ThemedButton onClick={handleRecovery} className="w-full mb-2">
          Buscar
        </ThemedButton>

        <ThemedButton onClick={onClose} className="w-full bg-gray-400 text-black">
          Cerrar
        </ThemedButton>

        <p style={{ marginTop: 10 }}>{message}</p>
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;
