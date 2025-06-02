import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import PasswordRecoveryModal from '../components/PasswordRecoveryModal';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';

const Login = () => {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [installVerified, setInstallVerified] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [licenseKeyExpected, setLicenseKeyExpected] = useState('');

  useEffect(() => {
    const fs = window.require('fs');
    const path = window.require('path');
    const { app } = window.require('@electron/remote');
    const licensePath = path.join(app.getPath('userData'), 'license.json');

    try {
      const installKey = localStorage.getItem('car-care-install-key') || '';
      const licenseRaw = fs.readFileSync(licensePath, 'utf-8');
      const licenseData = JSON.parse(licenseRaw);
      const expectedKey = licenseData.license_key;
      setLicenseKeyExpected(expectedKey);

      if (installKey === expectedKey) {
        setInstallVerified(true);
      }
    } catch (error) {
      console.error('❌ No se pudo leer license.json:', error);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('car-care-users') || '[]');
    const found = users.find((u: any) => u.cedula === cedula && u.password === password);

    if (found) {
      localStorage.setItem('car-care-active-user', JSON.stringify(found));
      navigate('/');
    } else {
      setError('Cédula o contraseña incorrecta');
    }
  };

  if (!installVerified) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>Activación requerida</h2>
        <p>Esta instalación requiere una clave de activación proporcionada por el desarrollador.</p>
        <input
          type="text"
          placeholder="Clave de instalación"
          onChange={e => localStorage.setItem('car-care-install-key', e.target.value)}
        />
        <br />
        <ThemedButton
          onClick={() => {
            const key = localStorage.getItem('car-care-install-key');
            if (key === licenseKeyExpected) {
              localStorage.setItem('car-care-install-key', key);
              window.location.reload(); // fuerza refresco
            } else {
              alert('Clave incorrecta');
            }
          }}
        >
          Verificar
        </ThemedButton>
      </div>
    );
  }

  if (showRegister) {
    return <Register />;
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <img
        src={localStorage.getItem('car-care-logo') || '/logo-taller.png'}
        alt="Logo Taller"
        style={{ width: '120px', marginBottom: '1rem' }}
      />
      <h2>Bienvenido</h2>
      <form onSubmit={handleLogin} style={{ maxWidth: '300px', margin: 'auto' }}>
        <input
          type="text"
          placeholder="Número identificación"
          value={cedula}
          onChange={e => setCedula(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px',marginLeft: 'auto',marginRight: 'auto'}}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px',marginLeft: 'auto',marginRight: 'auto'}}
        />

        <ThemedButton type="submit" 
                  style={{
                    marginTop: '1rem',
                    padding: '10px 24px',
                    width: 'auto',
                    minWidth: '160px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
          
          INGRESAR
        </ThemedButton>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      <p style={{ marginTop: '1rem' }}>
        <TextButton onClick={() => setShowRecovery(true)}>
          ¿Olvidó su contraseña?
        </TextButton>
      </p>

      <p>
        <TextButton onClick={() => setShowRegister(true)}>
          Registrarse
        </TextButton>
      </p>

      {showRecovery && <PasswordRecoveryModal onClose={() => setShowRecovery(false)} />}
    </div>
  );
};

export default Login;
