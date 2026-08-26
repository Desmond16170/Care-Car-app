import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import {
  listAllMaintenances,
  listVehicles,
  MaintenanceRecord,
  normalizePlate,
  VehicleRecord,
} from '../services/carCareData';

const Dashboard = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [vehicleRows, maintenanceRows] = await Promise.all([
          listVehicles(),
          listAllMaintenances(),
        ]);

        if (!mounted) return;
        setVehicles(vehicleRows);
        setMaintenances(maintenanceRows);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDashboard();
    return () => { mounted = false; };
  }, []);

  const oilChanges = useMemo(
    () => maintenances.filter(m => m.details?.category === 'oil_change'),
    [maintenances]
  );

  const recentMaintenances = useMemo(
    () => [...maintenances].sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()).slice(0, 6),
    [maintenances]
  );

  const recordCountByVehicle = useMemo(() => {
    const counts = new Map<string, number>();
    for (const maintenance of maintenances) {
      counts.set(maintenance.vehicle_id, (counts.get(maintenance.vehicle_id) || 0) + 1);
    }
    return counts;
  }, [maintenances]);

  const orderedVehicles = useMemo(
    () => [...vehicles].sort((a, b) => {
      const difference = (recordCountByVehicle.get(b.id) || 0) - (recordCountByVehicle.get(a.id) || 0);
      return difference !== 0 ? difference : (a.plate || '').localeCompare(b.plate || '');
    }),
    [vehicles, recordCountByVehicle]
  );

  const normalizedSearch = normalizePlate(searchPlate);
  const filteredVehicles = orderedVehicles.filter(vehicle =>
    (vehicle.plate || '').includes(normalizedSearch)
  );

  const selectedVehicle = normalizedSearch
    ? vehicles.find(vehicle => vehicle.plate === normalizedSearch) || null
    : null;

  const selectedHistory = selectedVehicle
    ? maintenances.filter(m => m.vehicle_id === selectedVehicle.id)
    : [];

  const vehicleById = useMemo(
    () => new Map(vehicles.map(vehicle => [vehicle.id, vehicle])),
    [vehicles]
  );

  if (loading) {
    return <div className="cc-card cc-empty">Cargando resumen del taller...</div>;
  }

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Actividad</div>
          <h1 className="cc-page-title">Resumen del taller</h1>
          <p className="cc-page-subtitle">Lo importante del día, sin entrar a cada vehículo.</p>
        </div>
        <ThemedButton onClick={() => navigate('/tramado')} style={{ width: 'auto' }}>
          Nueva recepción / tramado
        </ThemedButton>
      </div>

      {error && <div className="cc-alert cc-alert-danger">{error}</div>}

      <div className="cc-metric-grid">
        <div className="cc-card cc-metric-card">
          <span className="cc-metric-label">Vehículos activos</span>
          <strong className="cc-metric-value">{vehicles.length}</strong>
          <span className="cc-metric-caption">registrados en tu cuenta</span>
        </div>
        <div className="cc-card cc-metric-card">
          <span className="cc-metric-label">Mantenimientos</span>
          <strong className="cc-metric-value">{maintenances.length}</strong>
          <span className="cc-metric-caption">registros históricos</span>
        </div>
        <div className="cc-card cc-metric-card">
          <span className="cc-metric-label">Cambios de aceite</span>
          <strong className="cc-metric-value">{oilChanges.length}</strong>
          <span className="cc-metric-caption">dentro del historial</span>
        </div>
      </div>

      <div className="cc-dashboard-grid">
        <div className="cc-card cc-panel">
          <div className="cc-panel-head">
            <div>
              <h2>Vehículos</h2>
              <p>Busca una placa exacta para ver el historial aquí mismo.</p>
            </div>
            <ThemedButton onClick={() => navigate('/search')} style={{ width: 'auto' }}>
              Ver todos
            </ThemedButton>
          </div>

          <input
            className="cc-input"
            type="search"
            placeholder="Buscar placa..."
            value={searchPlate}
            onChange={e => setSearchPlate(e.target.value)}
          />

          <div className="cc-compact-list">
            {filteredVehicles.slice(0, 8).map(vehicle => (
              <button
                key={vehicle.id}
                className="cc-list-row"
                onClick={() => setSearchPlate(vehicle.plate || '')}
              >
                <div>
                  <strong>{vehicle.plate || 'Sin placa'}</strong>
                  <span>{vehicle.make} {vehicle.model}</span>
                </div>
                <div className="cc-list-row-end">
                  <strong>{vehicle.current_mileage.toLocaleString()} km</strong>
                  <span>{recordCountByVehicle.get(vehicle.id) || 0} registros</span>
                </div>
              </button>
            ))}
            {filteredVehicles.length === 0 && <div className="cc-empty-inline">No hay coincidencias.</div>}
          </div>
        </div>

        <div className="cc-card cc-panel">
          <div className="cc-panel-head">
            <div>
              <h2>{selectedVehicle ? selectedVehicle.plate : 'Actividad reciente'}</h2>
              <p>{selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Últimos mantenimientos registrados.'}</p>
            </div>
            {selectedVehicle && (
              <ThemedButton
                onClick={() => navigate(`/vehicle/${encodeURIComponent(selectedVehicle.plate || '')}`)}
                style={{ width: 'auto' }}
              >
                Abrir vehículo
              </ThemedButton>
            )}
          </div>

          <div className="cc-activity-list">
            {(selectedVehicle ? selectedHistory : recentMaintenances).map(item => {
              const vehicle = selectedVehicle || vehicleById.get(item.vehicle_id);
              return (
                <div key={item.id} className="cc-activity-row">
                  <div className="cc-activity-dot" />
                  <div className="cc-activity-copy">
                    <strong>{item.maintenance_type}</strong>
                    <span>
                      {vehicle?.plate ? `${vehicle.plate} · ` : ''}{item.service_date}
                      {item.mileage != null ? ` · ${item.mileage.toLocaleString()} km` : ''}
                    </span>
                    {item.notes && <small>{item.notes}</small>}
                  </div>
                </div>
              );
            })}
            {(selectedVehicle ? selectedHistory : recentMaintenances).length === 0 && (
              <div className="cc-empty-inline">Todavía no hay actividad para mostrar.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
