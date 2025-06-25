import React, { useState, useEffect } from 'react';
import ThemedButton from '../components/ThemedButton';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'oil' | 'theme'>('oil');

  const [oilTypes, setOilTypes] = useState<{ [key: string]: { km: number, mi: number } }>({});
  const [newType, setNewType] = useState('');
  const [newTypeKm, setNewTypeKm] = useState('');
  const [newTypeMi, setNewTypeMi] = useState('');

  const [oilBrands, setOilBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');

  const [viscosities, setViscosities] = useState<string[]>([]);
  const [newViscosity, setNewViscosity] = useState('');

  const [primaryColor, setPrimaryColor] = useState('#FFA500');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    const storedTypes = JSON.parse(localStorage.getItem('car-care-oil-types') || '{}');
    const storedBrands = JSON.parse(localStorage.getItem('car-care-oil-brands') || '[]');
    const storedViscosities = JSON.parse(localStorage.getItem('car-care-oil-viscosities') || '[]');
    const storedLogo = localStorage.getItem('car-care-logo');
    const storedPrimary = localStorage.getItem('car-care-primary-color');
    const storedText = localStorage.getItem('car-care-text-color');

    setOilTypes(storedTypes);
    setOilBrands(storedBrands);
    setViscosities(storedViscosities);
    if (storedLogo) setLogo(storedLogo);
    if (storedPrimary) setPrimaryColor(storedPrimary);
    if (storedText) setTextColor(storedText);
  }, []);

  const saveOilConfig = () => {
    localStorage.setItem('car-care-oil-types', JSON.stringify(oilTypes));
    localStorage.setItem('car-care-oil-brands', JSON.stringify(oilBrands));
    localStorage.setItem('car-care-oil-viscosities', JSON.stringify(viscosities));
    alert('✅ Datos de aceites guardados');
  };

  const saveThemeConfig = () => {
    localStorage.setItem('car-care-primary-color', primaryColor);
    localStorage.setItem('car-care-text-color', textColor);
    if (logo) localStorage.setItem('car-care-logo', logo);
    alert('🎨 Configuración visual guardada');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (list: string[], setList: (val: string[]) => void, index: number) => {
    const updated = [...list];
    updated.splice(index, 1);
    setList(updated);
  };

  const removeOilType = (key: string) => {
    const copy = { ...oilTypes };
    delete copy[key];
    setOilTypes(copy);
  };

  const buttonInlineStyle = {
    display: 'inline-block',
    width: 'auto',
    padding: '6px 16px',
    fontSize: '0.9rem',
    marginLeft: '10px'
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '1rem' }}>
      <h2>Configuración del Taller</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <ThemedButton onClick={() => setActiveTab('oil')}>
          🛢 Aceites y Viscosidades
        </ThemedButton>
        <ThemedButton onClick={() => setActiveTab('theme')}>
          🎨 Colores y Logo
        </ThemedButton>
      </div>

      {activeTab === 'oil' && (
        <>
          <h4>Tipos de Aceite</h4>
          <input placeholder="Nombre" value={newType} onChange={e => setNewType(e.target.value)} />
          <input type="number" placeholder="KM sugerido" value={newTypeKm} onChange={e => setNewTypeKm(e.target.value)} />
          <input type="number" placeholder="Millas sugeridas" value={newTypeMi} onChange={e => setNewTypeMi(e.target.value)} />
          <ThemedButton onClick={() => {
            if (newType && newTypeKm && newTypeMi) {
              setOilTypes({ ...oilTypes, [newType]: { km: Number(newTypeKm), mi: Number(newTypeMi) } });
              setNewType('');
              setNewTypeKm('');
              setNewTypeMi('');
            }
          }} style={{ marginBottom: '1rem' }}>Agregar Tipo</ThemedButton>
          <ul>
            {Object.entries(oilTypes).map(([k, v]) => (
              <li key={k} style={{ marginBottom: '0.5rem' }}>
                {k}: {v.km} km / {v.mi} mi
                <ThemedButton onClick={() => removeOilType(k)} style={buttonInlineStyle}>Eliminar</ThemedButton>
              </li>
            ))}
          </ul>

          <h4>Marcas de Aceite</h4>
          <input placeholder="Nueva marca" value={newBrand} onChange={e => setNewBrand(e.target.value)} />
          <ThemedButton onClick={() => {
            if (newBrand) {
              setOilBrands([...oilBrands, newBrand]);
              setNewBrand('');
            }
          }} style={{ marginBottom: '1rem' }}>Agregar Marca</ThemedButton>
          <ul>
            {oilBrands.map((b, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {b}
                <ThemedButton onClick={() => removeItem(oilBrands, setOilBrands, i)} style={buttonInlineStyle}>Eliminar</ThemedButton>
              </li>
            ))}
          </ul>

          <h4>Viscosidades</h4>
          <input placeholder="Nueva viscosidad (ej: 10W-30)" value={newViscosity} onChange={e => setNewViscosity(e.target.value)} />
          <ThemedButton onClick={() => {
            if (newViscosity) {
              setViscosities([...viscosities, newViscosity]);
              setNewViscosity('');
            }
          }} style={{ marginBottom: '1rem' }}>Agregar Viscosidad</ThemedButton>
          <ul>
            {viscosities.map((v, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {v}
                <ThemedButton onClick={() => removeItem(viscosities, setViscosities, i)} style={buttonInlineStyle}>Eliminar</ThemedButton>
              </li>
            ))}
          </ul>

          <ThemedButton onClick={saveOilConfig} style={{ marginTop: '1rem' }}>Guardar Configuración de Aceites</ThemedButton>
        </>
      )}

      {activeTab === 'theme' && (
        <>
          <h4>Colores de la App</h4>
          <label>Color principal: </label>
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
          <br />
          <label>Color de texto: </label>
          <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} />

          <h4>Logo del Taller</h4>
          <input type="file" accept="image/*" onChange={handleLogoUpload} />
          {logo && <img src={logo} alt="Logo" style={{ maxWidth: '150px', marginTop: '1rem' }} />}

          <ThemedButton onClick={saveThemeConfig} style={{ marginTop: '1rem' }}>Guardar Configuración Visual</ThemedButton>
        </>
      )}
    </div>
  );
};

export default Settings;
