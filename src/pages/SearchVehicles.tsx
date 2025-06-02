import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import TextButton from '../components/TextButton';

const SearchVehicles = () => {
  const [plate, setPlate] = useState('');
  const [foundVehicle, setFoundVehicle] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const allData = JSON.parse(localStorage.getItem('car-care-vehicles') || '{}');
    const userLists = Object.values(allData) as any[][];
    for (const list of userLists) {
      const match = list.find(v => v.plate?.toLowerCase() === plate.toLowerCase());
      if (match) {
        setFoundVehicle(match);
        setNotFound(false);
        return;
      }
    }
    setFoundVehicle(null);
    setNotFound(true);
  };

  const handleRegister = () => navigate('/add-vehicle');
  const goToMaintenance = () => navigate(`/vehicle/${plate}`);

  const inputStyle = {
    padding: '10px',
    width: '100%',
    maxWidth: '300px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
      <h2>Buscar Vehículo por placa</h2>

      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', gap: '10px', width: '100%', maxWidth: '300px' }}>
        <input
          type="text"
          placeholder="Placa"
          value={plate}
          onChange={e => setPlate(e.target.value)}
          style={inputStyle}
        />
        <ThemedButton type="submit" style={{ width: '100%' }}>
          Buscar
        </ThemedButton>
      </form>

      {foundVehicle && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p><strong>Vehículo encontrado:</strong></p>
          <p>{foundVehicle.make} {foundVehicle.model} ({foundVehicle.year}) - {foundVehicle.mileage} km</p>
          <ThemedButton onClick={goToMaintenance} className="mt-2">
            Ver mantenimiento
          </ThemedButton>
        </div>
      )}

      {notFound && (
        <div style={{ marginTop: '2rem', color: 'red', textAlign: 'center' }}>
          <p>No se encontraron vehículos con esa placa.</p>
          <ThemedButton onClick={handleRegister} className="mt-2">
            Registrar un nuevo vehículo
          </ThemedButton>
        </div>
      )}
    </div>
  );
};

export default SearchVehicles;
