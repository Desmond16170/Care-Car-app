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

  const activeCount = useMemo(() => vehicles.filter(vehicle => vehicle.is_active).length, [vehicles]);

  const goToVehicle = (vehicle: VehicleRecord) => {
    if (!vehicle.plate) return;
    navigate(`/vehicle/${encodeURIComponent(vehicle.plate)}`);
  };

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">Vehículos</h1>
          <p className="cc-page-subtitle">
            {activeCount} activo{activeCount === 1 ? '' : 's'} · busca por placa, marca, modelo, VIN o apodo.
          </p>
        </div>
        <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto', minWidth: '150px' }}>
          Agregar vehículo
        </ThemedButton>
      </div>

      <div className="cc-card-flat cc-search-toolbar">
        <input
          type="search"
          placeholder="Buscar vehículo..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="cc-input"
        />

        <label className="cc-toggle">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
          />
          Mostrar desactivados
        </label>
      </div>

      {error && (
        <div className="cc-card-flat" style={{ padding: '14px 16px', color: '#b43b3b', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="cc-card-flat cc-empty">Cargando vehículos...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="cc-card-flat cc-empty">
          <p>{query ? 'No hay coincidencias con esa búsqueda.' : 'Todavía no hay vehículos registrados.'}</p>
          {!query && (
            <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto', margin: '14px auto 0' }}>
              Registrar el primero
            </ThemedButton>
          )}
        </div>
      ) : (
        <div className="cc-vehicle-grid">
          {filteredVehicles.map(vehicle => (
            <article
              key={vehicle.id}
              className={`cc-card-flat cc-vehicle-card${vehicle.is_active ? '' : ' inactive'}`}
            >
              <div className="cc-vehicle-head">
                <div>
                  <div className="cc-plate">{vehicle.plate || 'Sin placa'}</div>
                  {vehicle.nickname && <div className="cc-muted" style={{ marginTop: '3px' }}>{vehicle.nickname}</div>}
                </div>
                <span className={`cc-status ${vehicle.is_active ? 'active' : 'inactive'}`}>
                  {vehicle.is_active ? 'Activo' : 'Desactivado'}
                </span>
              </div>

              <div className="cc-vehicle-meta">
                <strong style={{ color: '#17212b' }}>
                  {vehicle.make} {vehicle.model}
                  {vehicle.year ? ` · ${vehicle.year}` : ''}
                </strong>
                {vehicle.generation && <span>{vehicle.generation}</span>}
                <span>{vehicle.current_mileage.toLocaleString()} km</span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <ThemedButton onClick={() => goToVehicle(vehicle)} style={{ width: '100%' }}>
                  Abrir vehículo
                </ThemedButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default SearchVehicles;
