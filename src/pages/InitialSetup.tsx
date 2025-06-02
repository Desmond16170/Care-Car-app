import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';

const InitialSetup = () => {
  const [tallerName, setTallerName] = useState('');
  const [managerKey, setManagerKey] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#FFA500');
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [bodyTextColor, setBodyTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');



  const navigate = useNavigate();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let logoBase64 = '';
    if (logoFile) {
      logoBase64 = await convertToBase64(logoFile);
    }

    localStorage.setItem('car-care-taller-name', tallerName);
    localStorage.setItem('car-care-manager-key', managerKey);
    localStorage.setItem('car-care-logo', logoBase64);
    localStorage.setItem('car-care-primary-color', primaryColor);
    localStorage.setItem('car-care-text-color', textColor);
    localStorage.setItem('car-care-background-color', backgroundColor);
    localStorage.setItem('car-care-body-text-color', bodyTextColor);
    localStorage.setItem('car-care-font-family', fontFamily);
    localStorage.setItem('car-care-configured', 'true');

    alert('Configuración guardada exitosamente.');
    navigate('/1');
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Configuración Inicial del Taller</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: 'auto' }}>
        <div>
          <label>Nombre del Taller:</label>
          <input
            type="text"
            value={tallerName}
            onChange={(e) => setTallerName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label>Clave del Gerente:</label>
        <PasswordInput
          placeholder="Clave del gerente"
          value={managerKey}
          onChange={e => setManagerKey(e.target.value)}
          style={{ marginBottom: 10, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
/>
        </div>
        <div>
          <label>Logo del Taller:</label>
          <input type="file" accept="image/*" onChange={handleLogoUpload} />
        </div>
        <div>
          <label>Color de Fondo:</label>
          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
        </div>
        <div>
          <label>Color del Texto General:</label>
          <input type="color" value={bodyTextColor} onChange={(e) => setBodyTextColor(e.target.value)} />
        </div>
        <div>
          <label>Color del Botón:</label>
          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </div>
        <div>
          <label>Color del Texto del Botón:</label>
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
        </div>
        <div>
          <label>Fuente del Texto:</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          >
            <option value="Arial">Arial</option>
            <option value="Roboto">Roboto</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            marginTop: '20px',
            backgroundColor: primaryColor,
            color: textColor,
            padding: '10px',
            width: '100%',
          }}
        >
          Guardar Configuración
        </button>
      </form>
    </div>
  );
};

export default InitialSetup;
