import React, { useState } from 'react';

interface PasswordInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ placeholder, value, onChange, style }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          ...style,
          paddingRight: '1.5rem', // espacio para el botón
          boxSizing: 'border-box',
          height: '30px', // altura consistente
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(prev => !prev)}
        style={{
          position: 'absolute',
          right: 'auto',
          top: '20%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'auto',
          cursor: 'pointer',
          fontSize: '1.1rem',
          padding: 0
        }}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
  );
};

export default PasswordInput;
