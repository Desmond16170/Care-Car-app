import React, { useState, useEffect } from 'react';
import ThemedButton from '../components/ThemedButton';

const defaultOilTypes: { [key: string]: { km: number, mi: number } } = {
  '10W-30 Mineral': { km: 5000, mi: 3000 },
  '10W-40 Semi-sintético': { km: 8000, mi: 5000 },
  '5W-30 Sintético': { km: 12000, mi: 7500 },
  '5W-40 Sintético': { km: 15000, mi: 9300 }
};

const defaultBrands: string[] = ['Castrol', 'Mobil', 'Valvoline'];
const defaultViscosities: string[] = ['10W-30', '10W-40', '5W-30', '5W-40'];

const OilChangeLogger = ({
  plate,
  onOilChangeSaved
}: {
  plate: string;
  onOilChangeSaved?: () => void;
}) => {
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [oilType, setOilType] = useState('');
  const [brand, setBrand] = useState('');
  const [viscosity, setViscosity] = useState('');
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const [message, setMessage] = useState('');
  const [oilTypes, setOilTypes] = useState<{ [key: string]: { km: number; mi: number } }>({});
  const [oilBrands, setOilBrands] = useState<string[]>([]);
  const [oilViscosities, setOilViscosities] = useState<string[]>([]);

  useEffect(() => {
    const storedTypes = JSON.parse(localStorage.getItem('car-care-oil-types') || 'null');
    setOilTypes(storedTypes || defaultOilTypes);

    const storedBrands = JSON.parse(localStorage.getItem('car-care-oil-brands') || 'null');
    setOilBrands(storedBrands || defaultBrands);

    const storedViscosities = JSON.parse(localStorage.getItem('car-care-oil-viscosities') || 'null');
    setOilViscosities(storedViscosities || defaultViscosities);
  }, []);

  const handleSaveOilChange = () => {
    if (!plate || !mileage || !oilType || !brand || !viscosity) {
      setMessage('Faltan datos.');
      return;
    }

    const km = Number(mileage);
    const suggested = oilTypes[oilType]?.[unit] || 5000;
    const nextChange = km + suggested;

    const allChanges = JSON.parse(localStorage.getItem('car-care-oil-changes') || '{}');
    const entry = {
      date: new Date().toISOString().split('T')[0],
      mileage: km,
      oilType,
      brand,
      viscosity,
      unit,
      mileageNextChange: nextChange,
      notes
    };

    if (!allChanges[plate]) allChanges[plate] = [];
    allChanges[plate].push(entry);

    localStorage.setItem('car-care-oil-changes', JSON.stringify(allChanges));
    setMessage(`✅ Cambio guardado. Siguiente cambio a los ${nextChange} ${unit}.`);
    setMileage('');
    setNotes('');
    setOilType('');
    setBrand('');
    setViscosity('');

    if (onOilChangeSaved) onOilChangeSaved();
  };

  const inputStyle = {
    padding: '10px',
    width: '100%',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem' }}>
      <h3>Registrar cambio de aceite para {plate}</h3>

      <select value={unit} onChange={e => setUnit(e.target.value as 'km' | 'mi')} style={inputStyle}>
        <option value="km">Kilómetros</option>
        <option value="mi">Millas</option>
      </select>

      <input
        type="number"
        placeholder={`Kilometraje actual (${unit})`}
        value={mileage}
        onChange={e => setMileage(e.target.value)}
        style={inputStyle}
      />

      <select value={oilType} onChange={e => setOilType(e.target.value)} style={inputStyle}>
        <option value="">Selecciona el tipo de aceite</option>
        {Object.keys(oilTypes).map(type => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select value={brand} onChange={e => setBrand(e.target.value)} style={inputStyle}>
        <option value="">Selecciona la marca</option>
        {oilBrands.map(b => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select value={viscosity} onChange={e => setViscosity(e.target.value)} style={inputStyle}>
        <option value="">Selecciona la viscosidad</option>
        {oilViscosities.map(v => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      <textarea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        style={{ ...inputStyle, resize: 'vertical' }}
      />

      <ThemedButton onClick={handleSaveOilChange}>Guardar Cambio</ThemedButton>

      {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
    </div>
  );
};

export default OilChangeLogger;
