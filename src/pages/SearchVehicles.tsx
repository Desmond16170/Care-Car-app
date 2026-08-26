import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { listVehicles, VehicleRecord } from '../services/carCareData';

const SearchVehicles = () => {
  const [query, setQuery] = useState('');
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadVehicles = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await listVehicles(true);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los vehículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return vehicles.filter(vehicle => {
      if (!showInactive && !vehicle.is_active) return false;
      if (!normalized) return true;

      return [
        vehicle.plate,
        vehicle.make,
        vehicle.model,
        vehicle.nickname,
        vehicle.vin,
        vehicle.generation,
        vehicle.year?.toString(),
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalized));
    });
  }, [query, showInactive, vehicles]);

  const goToVehicle = (vehicle: VehicleRecord) => {
    if (!vehicle.plate) return;
    navigate(`/vehicle/${encodeURIComponent(vehicle.plate)}`);
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '8px',
    outlineColor: localStorage.getItem('car-care-primary-color') || '#FFA500',
    fontFamily: localStorage.getItem('car-care-font-family') || 'Arial'
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Vehículos</h2>
          <p style={{ marginTop: 0, color: '#666' }}>
            Busca por placa, marca, modelo, apodo, VIN o generación.
          </p>
        </div>
        <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto' }}>
          Agregar vehículo
        </ThemedButton>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar vehículo..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 320px' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
          />
          Mostrar desactivados
        </label>
      </div>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ marginTop: '2rem', textAlign: 'center' }}>Cargando vehículos...</p>
      ) : filteredVehicles.length === 0 ? (
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', border: '1px dashed #ccc', borderRadius: '10px' }}>
          <p>{query ? 'No hay coincidencias.' : 'Todavía no hay vehículos registrados.'}</p>
          {!query && (
            <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto' }}>
              Registrar el primero
            </ThemedButton>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {filteredVehicles.map(vehicle => (
            <article
              key={vehicle.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '10px',
                padding: '1rem',
                backgroundColor: vehicle.is_active ? '#fff' : '#f5f5f5',
                opacity: vehicle.is_active ? 1 : 0.78,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{vehicle.plate || 'Sin placa'}</strong>
                  {vehicle.nickname && <div style={{ color: '#666', marginTop: '2px' }}>{vehicle.nickname}</div>}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {vehicle.is_active ? 'ACTIVO' : 'DESACTIVADO'}
                </span>
              </div>

              <p style={{ marginBottom: '0.35rem' }}>
                {vehicle.make} {vehicle.model}
                {vehicle.year ? ` · ${vehicle.year}` : ''}
              </p>
              {vehicle.generation && <p style={{ margin: '0.35rem 0', color: '#666' }}>{vehicle.generation}</p>}
              <p style={{ margin: '0.35rem 0' }}>
                <strong>{vehicle.current_mileage.toLocaleString()}</strong> km
              </p>

              <ThemedButton onClick={() => goToVehicle(vehicle)} style={{ marginTop: '0.75rem', width: '100%' }}>
                Ver historial
              </ThemedButton>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchVehicles;
