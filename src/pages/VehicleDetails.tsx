import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import OilChangeLogger from './OilChangerLogger';
import {
  createMaintenance,
  findVehicleByPlate,
  listMaintenances,
  listMileageLogs,
  MaintenanceRecord,
  MileageLogRecord,
  recordMileage,
  setVehicleActive,
  updateVehicle,
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
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [mileageLogs, setMileageLogs] = useState<MileageLogRecord[]>([]);
  const [form, setForm] = useState({ type: '', date: '', mileage: '', notes: '' });
  const [mileageForm, setMileageForm] = useState({ mileage: '', notes: '' });
  const [editForm, setEditForm] = useState({
    plate: '',
    make: '',
    model: '',
    year: '',
    generation: '',
    nickname: '',
    vin: '',
  });
  const [showOilForm, setShowOilForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMileage, setSavingMileage] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState('');
  const [mileageMessage, setMileageMessage] = useState('');
  const [vehicleMessage, setVehicleMessage] = useState('');

  const syncEditForm = (record: VehicleRecord) => {
    setEditForm({
      plate: record.plate || '',
      make: record.make || '',
      model: record.model || '',
      year: record.year == null ? '' : String(record.year),
      generation: record.generation || '',
      nickname: record.nickname || '',
      vin: record.vin || '',
    });
  };

  const refreshMileageLogs = async (vehicleId: string) => {
    const logs = await listMileageLogs(vehicleId);
    setMileageLogs(logs);
  };

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
          setMileageLogs([]);
          return;
        }

        syncEditForm(found);

        const [history, logs] = await Promise.all([
          listMaintenances(found.id),
          listMileageLogs(found.id),
        ]);

        if (mounted) {
          setMaintenances(history);
          setMileageLogs(logs);
        }
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

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    const year = editForm.year.trim() ? Number(editForm.year) : null;
    if (year != null && (!Number.isInteger(year) || year < 1886 || year > 2200)) {
      setVehicleMessage('Ingresa un año válido.');
      return;
    }

    setSavingVehicle(true);
    setVehicleMessage('');

    try {
      const saved = await updateVehicle(vehicle.id, {
        plate: editForm.plate,
        make: editForm.make,
        model: editForm.model,
        year,
        generation: editForm.generation,
        nickname: editForm.nickname,
        vin: editForm.vin,
      });

      setVehicle(saved);
      syncEditForm(saved);
      setShowEditForm(false);
      setVehicleMessage('Datos del vehículo actualizados.');

      if (saved.plate && saved.plate !== plate) {
        navigate(`/vehicle/${encodeURIComponent(saved.plate)}`, { replace: true });
      }
    } catch (err) {
      setVehicleMessage(err instanceof Error ? err.message : 'No se pudo actualizar el vehículo.');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleVehicleStatus = async () => {
    if (!vehicle) return;

    if (vehicle.is_active) {
      const confirmed = window.confirm(
        '¿Desactivar este vehículo? El historial NO se eliminará y podrás restaurarlo después.'
      );
      if (!confirmed) return;
    }

    setChangingStatus(true);
    setVehicleMessage('');

    try {
      const saved = await setVehicleActive(vehicle.id, !vehicle.is_active);
      setVehicle(saved);
      setShowOilForm(false);
      setShowEditForm(false);
      setVehicleMessage(saved.is_active ? 'Vehículo restaurado.' : 'Vehículo desactivado. Su historial se conserva.');
    } catch (err) {
      setVehicleMessage(err instanceof Error ? err.message : 'No se pudo cambiar el estado del vehículo.');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !vehicle.is_active) return;

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
      await refreshMileageLogs(vehicle.id);
      setForm({ type: '', date: '', mileage: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el mantenimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleOilChangeSaved = async (saved: MaintenanceRecord) => {
    setMaintenances(current => [saved, ...current]);
    updateVehicleMileageInView(saved.mileage);
    if (vehicle) await refreshMileageLogs(vehicle.id);
  };

  const handleMileageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !vehicle.is_active) return;

    const value = Number(mileageForm.mileage);
    if (!Number.isFinite(value) || value < 0) {
      setMileageMessage('Ingresa un kilometraje válido.');
      return;
    }

    setSavingMileage(true);
    setMileageMessage('');

    try {
      const saved = await recordMileage(vehicle.id, value, mileageForm.notes);
      setMileageLogs(current => [saved, ...current]);
      updateVehicleMileageInView(saved.mileage);
      setMileageForm({ mileage: '', notes: '' });
      setMileageMessage('Kilometraje guardado.');
    } catch (err) {
      setMileageMessage(err instanceof Error ? err.message : 'No se pudo guardar el kilometraje.');
    } finally {
      setSavingMileage(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '6px',
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Cargando vehículo...</p>;
  if (error && !vehicle) return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;
  if (!vehicle) return <p style={{ textAlign: 'center' }}>Vehículo no encontrado en tu cuenta.</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Detalles del Vehículo</h2>
          <div style={{ fontWeight: 700, color: vehicle.is_active ? '#247a3d' : '#8a5a00' }}>
            {vehicle.is_active ? 'Vehículo activo' : 'Vehículo desactivado'}
          </div>
        </div>
        <ThemedButton onClick={() => navigate('/search')} style={{ width: 'auto' }}>
          Volver a vehículos
        </ThemedButton>
      </div>

      {!vehicle.is_active && (
        <div style={{ marginTop: '1rem', padding: '12px 15px', backgroundColor: '#fff4d8', borderRadius: '8px' }}>
          Este vehículo está desactivado. Puedes consultar e imprimir todo su historial, pero no agregar nuevos registros hasta restaurarlo.
        </div>
      )}

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {vehicleMessage && (
        <p style={{ marginTop: '1rem', fontWeight: 'bold', color: vehicleMessage.includes('No ') ? 'red' : '#247a3d' }}>
          {vehicleMessage}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <p><strong>Placa:</strong> {vehicle.plate}</p>
          {vehicle.nickname && <p><strong>Apodo:</strong> {vehicle.nickname}</p>}
          <p><strong>Marca:</strong> {vehicle.make}</p>
          <p><strong>Modelo:</strong> {vehicle.model}</p>
          {vehicle.year && <p><strong>Año:</strong> {vehicle.year}</p>}
          {vehicle.generation && <p><strong>Generación:</strong> {vehicle.generation}</p>}
          {vehicle.vin && <p><strong>VIN:</strong> {vehicle.vin}</p>}
          <p><strong>Kilometraje actual:</strong> {vehicle.current_mileage.toLocaleString()} km</p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem' }}>
            <ThemedButton onClick={handlePrint} style={{ width: 'auto' }}>
              Imprimir Historial
            </ThemedButton>
            <ThemedButton
              onClick={() => {
                syncEditForm(vehicle);
                setShowEditForm(current => !current);
                setVehicleMessage('');
              }}
              disabled={!vehicle.is_active}
              style={{ width: 'auto' }}
            >
              {showEditForm ? 'Cancelar edición' : 'Editar vehículo'}
            </ThemedButton>
            <ThemedButton onClick={handleVehicleStatus} disabled={changingStatus} style={{ width: 'auto' }}>
              {changingStatus
                ? 'Guardando...'
                : vehicle.is_active
                  ? 'Desactivar vehículo'
                  : 'Restaurar vehículo'}
            </ThemedButton>
          </div>

          {showEditForm && vehicle.is_active && (
            <form onSubmit={handleSaveVehicle} style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Editar datos</h3>
              <input value={editForm.plate} onChange={e => setEditForm({ ...editForm, plate: e.target.value })} placeholder="Placa" required style={inputStyle} />
              <input value={editForm.make} onChange={e => setEditForm({ ...editForm, make: e.target.value })} placeholder="Marca" required style={inputStyle} />
              <input value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} placeholder="Modelo" required style={inputStyle} />
              <input type="number" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} placeholder="Año" style={inputStyle} />
              <input value={editForm.generation} onChange={e => setEditForm({ ...editForm, generation: e.target.value })} placeholder="Generación" style={inputStyle} />
              <input value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} placeholder="Apodo (opcional)" style={inputStyle} />
              <input value={editForm.vin} onChange={e => setEditForm({ ...editForm, vin: e.target.value })} placeholder="VIN (opcional)" style={inputStyle} />
              <ThemedButton type="submit" disabled={savingVehicle}>
                {savingVehicle ? 'Guardando...' : 'Guardar cambios'}
              </ThemedButton>
            </form>
          )}

          {vehicle.is_active && (
            <>
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
            </>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          {vehicle.is_active ? (
            <>
              <form onSubmit={handleAddMaintenance}>
                <h3>Agregar Mantenimiento</h3>
                <input
                  type="text"
                  placeholder="Tipo (aceite, frenos...)"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Kilometraje"
                  value={form.mileage}
                  onChange={e => setForm({ ...form, mileage: e.target.value })}
                  required
                  style={inputStyle}
                />
                <textarea
                  placeholder="Notas (opcional)"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={inputStyle}
                />
                <ThemedButton type="submit" disabled={saving} className="w-full">
                  {saving ? 'Guardando...' : 'Guardar mantenimiento'}
                </ThemedButton>
              </form>

              <form onSubmit={handleMileageSubmit} style={{ marginTop: '2rem' }}>
                <h3>Actualizar Kilometraje</h3>
                <input
                  type="number"
                  min="0"
                  placeholder="Kilometraje actual"
                  value={mileageForm.mileage}
                  onChange={e => setMileageForm({ ...mileageForm, mileage: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={mileageForm.notes}
                  onChange={e => setMileageForm({ ...mileageForm, notes: e.target.value })}
                  style={inputStyle}
                />
                <ThemedButton type="submit" disabled={savingMileage}>
                  {savingMileage ? 'Guardando...' : 'Guardar kilometraje'}
                </ThemedButton>
                {mileageMessage && (
                  <p style={{ marginTop: '8px', color: mileageMessage === 'Kilometraje guardado.' ? 'green' : 'red' }}>
                    {mileageMessage}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              Restaura el vehículo para registrar nuevos mantenimientos o kilometraje.
            </div>
          )}
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Historial de Kilometraje</h3>
      {mileageLogs.length === 0 ? (
        <p>No hay registros de kilometraje.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {mileageLogs.map(log => (
            <li key={log.id} style={{
              backgroundColor: '#f4f7f9',
              padding: '12px 15px',
              marginBottom: '8px',
              borderRadius: '8px',
            }}>
              <strong>{log.mileage.toLocaleString()} km</strong>
              <span> · {new Date(log.recorded_at).toLocaleDateString()}</span>
              {log.notes && <div style={{ marginTop: '4px' }}>📝 {log.notes}</div>}
            </li>
          ))}
        </ul>
      )}

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
