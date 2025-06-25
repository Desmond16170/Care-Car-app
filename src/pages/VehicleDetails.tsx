import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import OilChangeLogger from './OilChangerLogger';

const handlePrint = () => {
  window.print();
};

const VehicleDetails = () => {
  const { plate } = useParams();
  const [vehicle, setVehicle] = useState<any>(null);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [form, setForm] = useState({ type: '', date: '', mileage: '', notes: '' });
  const [user, setUser] = useState<any>(null);
  const [showOilForm, setShowOilForm] = useState(false);
  const [oilHistory, setOilHistory] = useState<any[]>([]);

  useEffect(() => {
    const allVehicles = JSON.parse(localStorage.getItem('car-care-vehicles') || '{}');
    const users = Object.values(allVehicles).flat();
    const found = users.find((v: any) => v.plate === plate);
    setVehicle(found);

    const storedMaintenance = JSON.parse(localStorage.getItem('car-care-maintenance') || '{}');
    setMaintenances(storedMaintenance[plate!] || []);

    const currentUser = JSON.parse(localStorage.getItem('car-care-active-user') || 'null');
    setUser(currentUser);

    const storedOilChanges = JSON.parse(localStorage.getItem('car-care-oil-changes') || '{}');
    setOilHistory(storedOilChanges[plate!] || []);
  }, [plate]);

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord = {
      ...form,
      date: form.date || new Date().toISOString().split('T')[0],
      mechanic: user.name,
    };

    const storedMaintenance = JSON.parse(localStorage.getItem('car-care-maintenance') || '{}');
    const updated = storedMaintenance[plate!] || [];
    updated.push(newRecord);
    storedMaintenance[plate!] = updated;
    localStorage.setItem('car-care-maintenance', JSON.stringify(storedMaintenance));

    setMaintenances(updated);
    setForm({ type: '', date: '', mileage: '', notes: '' });
  };

  if (!vehicle) return <p>Vehículo no encontrado</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Detalles del Vehículo</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <p><strong>Placa:</strong> {vehicle.plate}</p>
          <p><strong>Marca:</strong> {vehicle.make}</p>
          <p><strong>Modelo:</strong> {vehicle.model}</p>
          <p><strong>Año:</strong> {vehicle.year}</p>
          <p><strong>Kilometraje:</strong> {vehicle.mileage} km</p>

          <ThemedButton onClick={handlePrint} className="mt-2">
            Imprimir Historial
          </ThemedButton>

          <ThemedButton onClick={() => setShowOilForm(!showOilForm)} style={{ marginTop: '1rem' }}>
            {showOilForm ? 'Cerrar cambio de aceite' : 'Registrar cambio de aceite'}
          </ThemedButton>

          {showOilForm && <OilChangeLogger plate={plate || ''} />}
        </div>

        {user ? (
          <form onSubmit={handleAddMaintenance} style={{ flex: 1, minWidth: '300px' }}>
            <h3>Agregar Mantenimiento</h3>
            <input
              type="text"
              placeholder="Tipo (aceite, frenos...)"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <input
              type="number"
              placeholder="Kilometraje"
              value={form.mileage}
              onChange={e => setForm({ ...form, mileage: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <textarea
              placeholder="Notas (opcional)"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <ThemedButton type="submit" className="w-full">
              Guardar mantenimiento
            </ThemedButton>
          </form>
        ) : (
          <p style={{ color: 'red', marginTop: '2rem' }}>
            Debes iniciar sesión para agregar un mantenimiento.
          </p>
        )}
      </div>

      <h3 style={{ marginTop: '2rem' }}>Historial de Cambios de Aceite</h3>
      {oilHistory.length === 0 ? (
        <p>No hay registros de cambios de aceite.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {oilHistory.map((entry, index) => (
            <li key={index} style={{
              backgroundColor: '#e9f8ff',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p><strong>📅 Fecha:</strong> {entry.date}</p>
              <p><strong>🛢 Tipo:</strong> {entry.oilType}</p>
              <p><strong>🏷 Marca:</strong> {entry.brand}</p>
              <p><strong>💧 Viscosidad:</strong> {entry.viscosity}</p>
              <p><strong>📍 Km actual:</strong> {entry.mileage}</p>
              <p><strong>🔁 Próximo cambio:</strong> {entry.mileageNextChange} km</p>
              {entry.notes && <p><strong>📝 Notas:</strong> {entry.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: '2rem 0' }} />
      <h3>Historial de Mantenimientos</h3>
      {maintenances.length === 0 ? (
        <p>No hay mantenimientos registrados.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {[...maintenances]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((m, index) => (
              <li key={index} style={{
                backgroundColor: '#f9f9f9',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <p><strong>🛠 Tipo:</strong> {m.type}</p>
                <p><strong>📅 Fecha:</strong> {m.date}</p>
                <p><strong>📍 Kilometraje:</strong> {m.mileage} km</p>
                {m.notes && <p><strong>📝 Notas:</strong> {m.notes}</p>}
                <p><strong>👨‍🔧 Registrado por:</strong> {m.mechanic}</p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default VehicleDetails;
