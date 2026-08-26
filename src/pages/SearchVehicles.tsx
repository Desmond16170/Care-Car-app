import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { findVehicleByPlate, normalizePlate, VehicleRecord } from '../services/carCareData';

const SearchVehicles = () => {
  const [plate, setPlate] = useState('');
  const [foundVehicle, setFoundVehicle] = useState<VehicleRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSearching(true);
    setError('');
    setNotFound(false);
    setFoundVehicle(null);

    try {
      const match = await findVehicleByPlate(plate);
      setFoundVehicle(match);
      setNotFound(!match);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo buscar el vehículo.');
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = () => navigate('/add-vehicle');
  const goToMaintenance = () => {
    if (foundVehicle?.plate) {
      navigate(`/vehicle/${encodeURIComponent(foundVehicle.plate)}`);
    }
  };

  const inputStyle: React.CSSProperties = {
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
        <ThemedButton type="submit" disabled={searching || !normalizePlate(plate)} style={{ width: '100%' }}>
          {searching ? 'Buscando...' : 'Buscar'}
        </ThemedButton>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      )}

      {foundVehicle && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p><strong>Vehículo encontrado:</strong></p>
          <p>
            {foundVehicle.make} {foundVehicle.model}
            {foundVehicle.year ? ` (${foundVehicle.year})` : foundVehicle.generation ? ` (${foundVehicle.generation})` : ''}
            {' - '}{foundVehicle.current_mileage} km
          </p>
          <ThemedButton onClick={goToMaintenance} className="mt-2">
            Ver mantenimiento
          </ThemedButton>
        </div>
      )}

      {notFound && (
        <div style={{ marginTop: '2rem', color: 'red', textAlign: 'center' }}>
          <p>No se encontraron vehículos con esa placa en tu cuenta.</p>
          <ThemedButton onClick={handleRegister} className="mt-2">
            Registrar un nuevo vehículo
          </ThemedButton>
        </div>
      )}
    </div>
  );
};

export default SearchVehicles;
