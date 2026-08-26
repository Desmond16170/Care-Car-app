import React, { useEffect, useState } from 'react';
import ThemedButton from '../components/ThemedButton';
import { createVehicle, getCurrentUser } from '../services/carCareData';

const AddVehicle = () => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [plate, setPlate] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then(() => mounted && setIsAuthenticated(true))
      .catch(() => mounted && setIsAuthenticated(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await createVehicle({
        make,
        model,
        year: Number(year),
        currentMileage: Number(mileage),
        plate,
      });

      setMessage('¡Vehículo guardado con éxito!');
      setMake('');
      setModel('');
      setYear('');
      setMileage('');
      setPlate('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el vehículo.');
    } finally {
      setSaving(false);
    }
  };

  if (isAuthenticated === null) {
    return <p style={{ textAlign: 'center' }}>Comprobando sesión...</p>;
  }

  if (!isAuthenticated) {
    return <p style={{ color: 'red', textAlign: 'center' }}>Debes iniciar sesión para acceder a esta página.</p>;
  }

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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleAddVehicle} style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Agregar Vehículo</h2>

        <input type="text" placeholder="Placa" value={plate} onChange={e => setPlate(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Marca" value={make} onChange={e => setMake(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Modelo" value={model} onChange={e => setModel(e.target.value)} required style={inputStyle} />
        <input type="number" placeholder="Año" value={year} onChange={e => setYear(e.target.value)} min="1886" max="2200" required style={inputStyle} />
        <input type="number" placeholder="Kilometraje" value={mileage} onChange={e => setMileage(e.target.value)} min="0" required style={inputStyle} />

        <ThemedButton
          type="submit"
          disabled={saving}
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
          {saving ? 'Guardando...' : 'Guardar Vehículo'}
        </ThemedButton>

        {message && (
          <p style={{ marginTop: '10px', color: message.includes('éxito') ? 'green' : 'red', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AddVehicle;
