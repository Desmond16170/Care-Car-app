import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import PasswordInput from '../components/PasswordInput';

const Register = () => {
  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [managerKeyInput, setManagerKeyInput] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const storedKey = localStorage.getItem('car-care-manager-key');
    if (storedKey !== managerKeyInput) {
      setMessage('Clave del gerente incorrecta');
      return;
    }

    const newUser = { cedula, name, password };
    const users = JSON.parse(localStorage.getItem('car-care-users') || '[]');

    if (users.find((u: any) => u.cedula === cedula)) {
      setMessage('Ya existe un usuario con esta cédula');
      return;
    }

    users.push(newUser);
    localStorage.setItem('car-care-users', JSON.stringify(users));

    setMessage('¡Usuario registrado exitosamente!');
    setCedula('');
    setName('');
    setPassword('');
    setManagerKeyInput('');
  };

  const maintenances = JSON.parse(localStorage.getItem('car-care-maintenance') || '[]');

  const inputStyle: React.CSSProperties = {
    padding: '10px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '10px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial'
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: 'auto' }}>
        <input
          type="text"
          placeholder="Número de identificación"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <PasswordInput
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <PasswordInput
          placeholder="Clave del gerente"
          value={managerKeyInput}
          onChange={e => setManagerKeyInput(e.target.value)}
          style={inputStyle}
        />
        <ThemedButton
          type="submit"
          style={{
            marginTop: '1rem',
            padding: '10px 24px',
            width: 'auto',
            minWidth: '160px',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          Registrar
        </ThemedButton>
      </form>

      {message && (
        <p style={{ marginTop: '10px', fontWeight: 'bold', color: message.includes('exitosamente') ? 'green' : 'red' }}>
          {message}
        </p>
      )}

      <ThemedButton
        onClick={() => navigate('/')}
        style={{
          marginTop: '1rem',
          padding: '10px 24px',
          width: 'auto',
          minWidth: '160px',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        Volver
      </ThemedButton>

      <div id="print-area" style={{ display: 'none' }}>
        <h2>Historial de Mantenimientos</h2>
        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse', border: '1px solid black' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Kilometraje</th>
              <th>Notas</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {maintenances.map((m: any, index: number) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{m.tipo}</td>
                <td>{m.fecha}</td>
                <td>{m.kilometraje}</td>
                <td>{m.notas}</td>
                <td>{m.usuario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Register;
