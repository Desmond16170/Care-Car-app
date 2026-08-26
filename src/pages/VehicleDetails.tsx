import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import OilChangeLogger from './OilChangerLogger';
import {
  createMaintenance,
  findVehicleByPlate,
  listMaintenances,
  MaintenanceRecord,
  VehicleRecord,
} from '../services/carCareData';

const handlePrint = () => {
  window.print();
};

const detailValue = (maintenance: MaintenanceRecord, key: string) => {
  const value = maintenance.details?.[key];
  return value == null ? '' : String(value);
};

const VehicleDetails = () => {
  const { plate } = useParams();
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [form, setForm] = useState({ type: '', date: '', mileage: '', notes: '' });
  const [showOilForm, setShowOilForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadVehicle = async () => {
      setLoading(true);
      setError('');

      try {
        if (!plate) throw new Error('No se indicó una placa.');

        const found = await findVehicleByPlate(decodeURIComponent(plate));
        if (!mounted) return;

        setVehicle(found);
        if (!found) {
          setMaintenances([]);
          return;
        }

        const history = await listMaintenances(found.id);
        if (mounted) setMaintenances(history);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos del vehículo.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadVehicle();

    return () => {
      mounted = false;
    };
  }, [plate]);

  const oilHistory = useMemo(
    () => maintenances.filter(m => m.details?.category === 'oil_change'),
    [maintenances]
  );

  const updateVehicleMileageInView = (mileage: number | null) => {
    if (mileage == null) return;
    setVehicle(current => {
      if (!current || mileage <= current.current_mileage) return current;
      return { ...current, current_mileage: mileage };
    });
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    setSaving(true);
    setError('');

    try {
      const saved = await createMaintenance({
        vehicleId: vehicle.id,
        maintenanceType: form.type,
        serviceDate: form.date || undefined,
        mileage: Number(form.mileage),
        notes: form.notes,
      });

      setMaintenances(current => [saved, ...current]);
      updateVehicleMileageInView(saved.mileage);
      setForm({ type: '', date: '', mileage: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el mantenimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleOilChangeSaved = (saved: MaintenanceRecord) => {
    setMaintenances(current => [saved, ...current]);
    updateVehicleMileageInView(saved.mileage);
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Cargando vehículo...</p>;
  if (error && !vehicle) return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;
  if (!vehicle) return <p style={{ textAlign: 'center' }}>Vehículo no encontrado en tu cuenta.</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Detalles del Vehículo</h2>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <p><strong>Placa:</strong> {vehicle.plate}</p>
          <p><strong>Marca:</strong> {vehicle.make}</p>
          <p><strong>Modelo:</strong> {vehicle.model}</p>
          {vehicle.year && <p><strong>Año:</strong> {vehicle.year}</p>}
          {vehicle.generation && <p><strong>Generación:</strong> {vehicle.generation}</p>}
          <p><strong>Kilometraje:</strong> {vehicle.current_mileage} km</p>

          <ThemedButton onClick={handlePrint} className="mt-2">
            Imprimir Historial
          </ThemedButton>

          <ThemedButton onClick={() => setShowOilForm(!showOilForm)} style={{ marginTop: '1rem' }}>
            {showOilForm ? 'Cerrar cambio de aceite' : 'Registrar cambio de aceite'}
          </ThemedButton>

          {showOilForm && (
            <OilChangeLogger
              vehicleId={vehicle.id}
              plate={vehicle.plate || ''}
              onOilChangeSaved={handleOilChangeSaved}
            />
          )}
        </div>

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
            min="0"
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
          <ThemedButton type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar mantenimiento'}
          </ThemedButton>
        </form>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Historial de Cambios de Aceite</h3>
      {oilHistory.length === 0 ? (
        <p>No hay registros de cambios de aceite.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {oilHistory.map(entry => {
            const unit = detailValue(entry, 'unit') || 'km';
            const enteredMileage = detailValue(entry, 'entered_mileage') || String(entry.mileage ?? '');
            const nextChange = detailValue(entry, 'next_change_mileage');

            return (
              <li key={entry.id} style={{
                backgroundColor: '#e9f8ff',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <p><strong>📅 Fecha:</strong> {entry.service_date}</p>
                <p><strong>🛢 Tipo:</strong> {detailValue(entry, 'oil_type')}</p>
                <p><strong>🏷 Marca:</strong> {detailValue(entry, 'brand')}</p>
                <p><strong>💧 Viscosidad:</strong> {detailValue(entry, 'viscosity')}</p>
                <p><strong>📍 Kilometraje:</strong> {enteredMileage} {unit}</p>
                {nextChange && <p><strong>🔁 Próximo cambio:</strong> {nextChange} {unit}</p>}
                {entry.notes && <p><strong>📝 Notas:</strong> {entry.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <hr style={{ margin: '2rem 0' }} />
      <h3>Historial de Mantenimientos</h3>
      {maintenances.length === 0 ? (
        <p>No hay mantenimientos registrados.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {maintenances.map(m => (
            <li key={m.id} style={{
              backgroundColor: '#f9f9f9',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p><strong>🛠 Tipo:</strong> {m.maintenance_type}</p>
              <p><strong>📅 Fecha:</strong> {m.service_date}</p>
              {m.mileage != null && <p><strong>📍 Kilometraje:</strong> {m.mileage} km</p>}
              {m.notes && <p><strong>📝 Notas:</strong> {m.notes}</p>}
              <p><strong>👨‍🔧 Registrado por:</strong> {m.performed_by || 'Usuario'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VehicleDetails;
