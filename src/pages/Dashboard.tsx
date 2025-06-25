import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';

const Dashboard = () => {
  const navigate = useNavigate();

  const [vehicleCount, setVehicleCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [oilChangeCount, setOilChangeCount] = useState(0);
  const [topVehicles, setTopVehicles] = useState<{ plate: string, count: number }[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [oilChangeHistory, setOilChangeHistory] = useState<any[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<{ make: string, model: string, year: string, plate: string } | null>(null);

  useEffect(() => {
    const allVehicles = JSON.parse(localStorage.getItem('car-care-vehicles') || '{}');
    const totalVehicles = Object.values(allVehicles).flat().length;
    setVehicleCount(totalVehicles);

    const allMaintenance = JSON.parse(localStorage.getItem('car-care-maintenance') || '{}');
    const maintenanceTotal = Object.values(allMaintenance).flat().length;
    setMaintenanceCount(maintenanceTotal);

    const allOilChanges = JSON.parse(localStorage.getItem('car-care-oil-changes') || '{}');
    const oilEntries = Object.entries(allOilChanges);
    const oilTotal = oilEntries.reduce((acc, [, entries]) => acc + (entries as any[]).length, 0);
    setOilChangeCount(oilTotal);

    const vehicleMap: { [plate: string]: number } = {};

    for (const [plate, entries] of Object.entries(allMaintenance)) {
      vehicleMap[plate] = (vehicleMap[plate] || 0) + (entries as any[]).length;
    }

    for (const [plate, entries] of Object.entries(allOilChanges)) {
      vehicleMap[plate] = (vehicleMap[plate] || 0) + (entries as any[]).length;
    }

    const top = Object.entries(vehicleMap)
      .sort((a, b) => b[1] - a[1])
      .map(([plate, count]) => ({ plate, count }));

    setTopVehicles(top);
  }, []);

  useEffect(() => {
    const maint = JSON.parse(localStorage.getItem('car-care-maintenance') || '{}');
    const oil = JSON.parse(localStorage.getItem('car-care-oil-changes') || '{}');
    const allVehicles = JSON.parse(localStorage.getItem('car-care-vehicles') || '{}');
    const vehiclesFlat = Object.values(allVehicles).flat() as any[];

    const found = vehiclesFlat.find(v => v.plate.toLowerCase() === searchPlate.toLowerCase());
    setVehicleInfo(found || null);

    setMaintenanceHistory(maint[searchPlate] || []);
    setOilChangeHistory(oil[searchPlate] || []);
  }, [searchPlate]);

  const boxStyle: React.CSSProperties = {
    backgroundColor: '#f1f1f1',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      {/* Columna izquierda */}
      <div style={{ flex: 1, minWidth: '320px' }}>
        <h2>Resumen del Taller</h2>

        <div style={boxStyle}><strong>🚗 Vehículos registrados:</strong> {vehicleCount}</div>
        <div style={boxStyle}><strong>🛠 Mantenimientos:</strong> {maintenanceCount}</div>
        <div style={boxStyle}><strong>🛢 Cambios de aceite:</strong> {oilChangeCount}</div>

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
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />

          <ul>
            {topVehicles
              .filter(v => v.plate.toLowerCase().includes(searchPlate.toLowerCase()))
              .map(v => (
                <li key={v.plate}>{v.plate} – {v.count} registros</li>
              ))}
            {topVehicles.filter(v => v.plate.toLowerCase().includes(searchPlate.toLowerCase())).length === 0 && (
              <li>No hay coincidencias.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Columna derecha: historial si hay placa exacta */}
      {searchPlate && (maintenanceHistory.length > 0 || oilChangeHistory.length > 0) && (
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h2>
            Historial de{' '}
            {vehicleInfo
              ? `${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year} – Placa: ${searchPlate}`
              : `Placa: ${searchPlate}`}
          </h2>

          {vehicleInfo && (
            <ThemedButton
              onClick={() => navigate(`/vehicle/${vehicleInfo.plate}`)}
              style={{ width: 'auto', marginBottom: '1rem' }}
            >
              Ver perfil del vehículo
            </ThemedButton>
          )}

          {maintenanceHistory.length > 0 && (
            <div style={boxStyle}>
              <strong>🛠 Mantenimientos:</strong>
              <ul style={{ paddingLeft: '1rem' }}>
                {maintenanceHistory.map((m, index) => (
                  <li key={index}>
                    {m.date} – {m.type} ({m.mileage} km)
                    {m.notes && <div>📝 {m.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {oilChangeHistory.length > 0 && (
            <div style={boxStyle}>
              <strong>🛢 Cambios de aceite:</strong>
              <ul style={{ paddingLeft: '1rem' }}>
                {oilChangeHistory.map((o, index) => (
                  <li key={index}>
                    {o.date} – {o.oilType}, {o.brand}, {o.viscosity}
                    <div>{o.mileage} {o.unit}, siguiente: {o.mileageNextChange} {o.unit}</div>
                    {o.notes && <div>📝 {o.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
