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

    return () => {
      mounted = false;
    };
  }, []);

  const oilChanges = useMemo(
    () => maintenances.filter(m => m.details?.category === 'oil_change'),
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
      if (difference !== 0) return difference;
      return (a.plate || '').localeCompare(b.plate || '');
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

  const selectedOilHistory = selectedHistory.filter(m => m.details?.category === 'oil_change');
  const selectedGeneralHistory = selectedHistory.filter(m => m.details?.category !== 'oil_change');

  const boxStyle: React.CSSProperties = {
    backgroundColor: '#f1f1f1',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando resumen...</p>;
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '320px' }}>
        <h2>Resumen del Taller</h2>
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

        <div style={boxStyle}><strong>🚗 Vehículos registrados:</strong> {vehicles.length}</div>
        <div style={boxStyle}><strong>🛠 Mantenimientos:</strong> {maintenances.length}</div>
        <div style={boxStyle}><strong>🛢 Cambios de aceite:</strong> {oilChanges.length}</div>

        <div style={boxStyle}>
          <strong>🚗🔧 Vehículos registrados:</strong>

          <input
            type="text"
            placeholder="Buscar placa"
            value={searchPlate}
            onChange={e => setSearchPlate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '10px',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />

          <ul style={{ paddingLeft: '1.2rem' }}>
            {filteredVehicles.map(vehicle => (
              <li key={vehicle.id}>
                {vehicle.plate || 'Sin placa'} – {recordCountByVehicle.get(vehicle.id) || 0} registros
              </li>
            ))}
            {filteredVehicles.length === 0 && <li>No hay coincidencias.</li>}
          </ul>
        </div>
      </div>

      {selectedVehicle && (
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h2>
            Historial de {selectedVehicle.make} {selectedVehicle.model}
            {selectedVehicle.year ? ` ${selectedVehicle.year}` : ''} – Placa: {selectedVehicle.plate}
          </h2>

          <p><strong>Kilometraje actual:</strong> {selectedVehicle.current_mileage.toLocaleString()} km</p>

          <ThemedButton
            onClick={() => navigate(`/vehicle/${encodeURIComponent(selectedVehicle.plate || '')}`)}
            style={{ width: 'auto', marginBottom: '1rem' }}
          >
            Ver perfil del vehículo
          </ThemedButton>

          {selectedGeneralHistory.length > 0 && (
            <div style={boxStyle}>
              <strong>🛠 Mantenimientos:</strong>
              <ul style={{ paddingLeft: '1rem' }}>
                {selectedGeneralHistory.map(m => (
                  <li key={m.id} style={{ marginBottom: '8px' }}>
                    {m.service_date} – {m.maintenance_type}
                    {m.mileage != null && ` (${m.mileage.toLocaleString()} km)`}
                    {m.notes && <div>📝 {m.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedOilHistory.length > 0 && (
            <div style={boxStyle}>
              <strong>🛢 Cambios de aceite:</strong>
              <ul style={{ paddingLeft: '1rem' }}>
                {selectedOilHistory.map(o => (
                  <li key={o.id} style={{ marginBottom: '8px' }}>
                    {o.service_date} – {String(o.details?.oil_type || o.maintenance_type)}
                    {o.details?.brand ? `, ${String(o.details.brand)}` : ''}
                    {o.details?.viscosity ? `, ${String(o.details.viscosity)}` : ''}
                    {o.mileage != null && <div>{o.mileage.toLocaleString()} km</div>}
                    {o.notes && <div>📝 {o.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedHistory.length === 0 && (
            <div style={boxStyle}>Este vehículo todavía no tiene mantenimientos registrados.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
