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
  const [editForm, setEditForm] = useState({ plate: '', make: '', model: '', year: '', generation: '', nickname: '', vin: '' });
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
    setMileageLogs(await listMileageLogs(vehicleId));
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
        const [history, logs] = await Promise.all([listMaintenances(found.id), listMileageLogs(found.id)]);
        if (mounted) {
          setMaintenances(history);
          setMileageLogs(logs);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos del vehículo.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadVehicle();
    return () => { mounted = false; };
  }, [plate]);

  const oilHistory = useMemo(
    () => maintenances.filter(m => m.details?.category === 'oil_change'),
    [maintenances]
  );

  const generalHistory = useMemo(
    () => maintenances.filter(m => m.details?.category !== 'oil_change'),
    [maintenances]
  );

  const updateVehicleMileageInView = (mileage: number | null) => {
    if (mileage == null) return;
    setVehicle(current => !current || mileage <= current.current_mileage ? current : { ...current, current_mileage: mileage });
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
      if (saved.plate && saved.plate !== plate) navigate(`/vehicle/${encodeURIComponent(saved.plate)}`, { replace: true });
    } catch (err) {
      setVehicleMessage(err instanceof Error ? err.message : 'No se pudo actualizar el vehículo.');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleVehicleStatus = async () => {
    if (!vehicle) return;
    if (vehicle.is_active && !window.confirm('¿Desactivar este vehículo? El historial se conservará y podrás restaurarlo después.')) return;

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

  if (loading) return <div className="cc-card cc-empty">Cargando vehículo...</div>;
  if (error && !vehicle) return <div className="cc-alert cc-alert-danger">{error}</div>;
  if (!vehicle) return <div className="cc-card cc-empty">Vehículo no encontrado en tu cuenta.</div>;

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Ficha del vehículo</div>
          <div className="cc-detail-title-row">
            <h1 className="cc-page-title">{vehicle.plate || 'Sin placa'}</h1>
            <span className={`cc-status ${vehicle.is_active ? 'active' : 'inactive'}`}>{vehicle.is_active ? 'ACTIVO' : 'DESACTIVADO'}</span>
          </div>
          <p className="cc-page-subtitle">{vehicle.make} {vehicle.model}{vehicle.year ? ` · ${vehicle.year}` : ''}{vehicle.nickname ? ` · ${vehicle.nickname}` : ''}</p>
        </div>
        <ThemedButton onClick={() => navigate('/search')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>
          Volver a vehículos
        </ThemedButton>
      </div>

      {!vehicle.is_active && <div className="cc-alert cc-alert-info">Puedes consultar e imprimir el historial, pero debes restaurar el vehículo para agregar registros nuevos.</div>}
      {error && <div className="cc-alert cc-alert-danger">{error}</div>}
      {vehicleMessage && <div className={vehicleMessage.toLowerCase().includes('no se') ? 'cc-alert cc-alert-danger' : 'cc-alert cc-alert-info'}>{vehicleMessage}</div>}

      <div className="cc-detail-summary-grid">
        <div className="cc-card cc-detail-summary-main">
          <div className="cc-detail-mileage"><span>Kilometraje actual</span><strong>{vehicle.current_mileage.toLocaleString()} km</strong></div>
          <div className="cc-detail-meta-grid">
            <div><span>Marca</span><strong>{vehicle.make}</strong></div>
            <div><span>Modelo</span><strong>{vehicle.model}</strong></div>
            <div><span>Generación</span><strong>{vehicle.generation || '—'}</strong></div>
            <div><span>VIN</span><strong>{vehicle.vin || '—'}</strong></div>
          </div>
        </div>

        <div className="cc-card cc-detail-actions">
          <ThemedButton onClick={() => navigate('/tramado')}>Recepción / tramado</ThemedButton>
          <ThemedButton onClick={() => window.print()} style={{ backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Imprimir historial</ThemedButton>
          <ThemedButton
            onClick={() => { syncEditForm(vehicle); setShowEditForm(current => !current); setVehicleMessage(''); }}
            disabled={!vehicle.is_active}
            style={{ backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}
          >
            {showEditForm ? 'Cerrar edición' : 'Editar vehículo'}
          </ThemedButton>
          <ThemedButton onClick={handleVehicleStatus} disabled={changingStatus} style={{ backgroundColor: vehicle.is_active ? '#fff' : '#287a49', color: vehicle.is_active ? '#9a6815' : '#fff', border: '1px solid #e3d2ae' }}>
            {changingStatus ? 'Guardando...' : vehicle.is_active ? 'Desactivar' : 'Restaurar vehículo'}
          </ThemedButton>
        </div>
      </div>

      {showEditForm && vehicle.is_active && (
        <form onSubmit={handleSaveVehicle} className="cc-card cc-panel cc-edit-panel">
          <div className="cc-panel-head"><div><h2>Editar datos</h2><p>Estos cambios no alteran el historial existente.</p></div></div>
          <div className="cc-field-grid">
            <label className="cc-field"><span>Placa</span><input className="cc-input cc-plate-input" value={editForm.plate} onChange={e => setEditForm({ ...editForm, plate: e.target.value.toUpperCase() })} required /></label>
            <label className="cc-field"><span>Apodo</span><input className="cc-input" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} /></label>
            <label className="cc-field"><span>Marca</span><input className="cc-input" value={editForm.make} onChange={e => setEditForm({ ...editForm, make: e.target.value })} required /></label>
            <label className="cc-field"><span>Modelo</span><input className="cc-input" value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} required /></label>
            <label className="cc-field"><span>Año</span><input className="cc-input" type="number" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} /></label>
            <label className="cc-field"><span>Generación</span><input className="cc-input" value={editForm.generation} onChange={e => setEditForm({ ...editForm, generation: e.target.value })} /></label>
            <label className="cc-field cc-field-full"><span>VIN</span><input className="cc-input" value={editForm.vin} onChange={e => setEditForm({ ...editForm, vin: e.target.value })} /></label>
          </div>
          <div className="cc-form-actions"><span /><ThemedButton type="submit" disabled={savingVehicle} style={{ width: 'auto' }}>{savingVehicle ? 'Guardando...' : 'Guardar cambios'}</ThemedButton></div>
        </form>
      )}

      <div className="cc-work-grid">
        <form onSubmit={handleAddMaintenance} className="cc-card cc-panel">
          <div className="cc-panel-head"><div><h2>Nuevo mantenimiento</h2><p>Registra el trabajo realizado y el kilometraje.</p></div></div>
          <label className="cc-field"><span>Tipo de mantenimiento</span><input className="cc-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="Frenos, suspensión, afinamiento..." required disabled={!vehicle.is_active} /></label>
          <div className="cc-field-grid" style={{ marginTop: '10px' }}>
            <label className="cc-field"><span>Fecha</span><input className="cc-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} disabled={!vehicle.is_active} /></label>
            <label className="cc-field"><span>Kilometraje</span><input className="cc-input" type="number" min="0" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} required disabled={!vehicle.is_active} /></label>
          </div>
          <label className="cc-field" style={{ marginTop: '10px' }}><span>Notas</span><textarea className="cc-input cc-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones opcionales" disabled={!vehicle.is_active} /></label>
          <ThemedButton type="submit" disabled={saving || !vehicle.is_active} style={{ marginTop: '12px' }}>{saving ? 'Guardando...' : 'Guardar mantenimiento'}</ThemedButton>
        </form>

        <div className="cc-card cc-panel">
          <div className="cc-panel-head"><div><h2>Kilometraje y aceite</h2><p>Actualizaciones rápidas sin abrir otro módulo.</p></div></div>
          <form onSubmit={handleMileageSubmit}>
            <label className="cc-field"><span>Kilometraje actual</span><input className="cc-input" type="number" min="0" value={mileageForm.mileage} onChange={e => setMileageForm({ ...mileageForm, mileage: e.target.value })} required disabled={!vehicle.is_active} /></label>
            <label className="cc-field" style={{ marginTop: '10px' }}><span>Nota</span><input className="cc-input" value={mileageForm.notes} onChange={e => setMileageForm({ ...mileageForm, notes: e.target.value })} placeholder="Opcional" disabled={!vehicle.is_active} /></label>
            <ThemedButton type="submit" disabled={savingMileage || !vehicle.is_active} style={{ marginTop: '12px' }}>{savingMileage ? 'Guardando...' : 'Actualizar kilometraje'}</ThemedButton>
            {mileageMessage && <div className={mileageMessage === 'Kilometraje guardado.' ? 'cc-inline-success' : 'cc-inline-error'}>{mileageMessage}</div>}
          </form>
          <div className="cc-divider" />
          <ThemedButton onClick={() => setShowOilForm(current => !current)} disabled={!vehicle.is_active} style={{ backgroundColor: '#fff8f1', color: '#8b4c12', border: '1px solid #efcfad' }}>
            {showOilForm ? 'Cerrar cambio de aceite' : 'Registrar cambio de aceite'}
          </ThemedButton>
          {showOilForm && <OilChangeLogger vehicleId={vehicle.id} plate={vehicle.plate || ''} onOilChangeSaved={handleOilChangeSaved} />}
        </div>
      </div>

      <div className="cc-history-grid">
        <div className="cc-card cc-panel">
          <div className="cc-panel-head"><div><h2>Mantenimientos</h2><p>{generalHistory.length} registros</p></div></div>
          <div className="cc-timeline">
            {generalHistory.map(m => (
              <article key={m.id} className="cc-timeline-row">
                <div><strong>{m.maintenance_type}</strong><span>{m.service_date}{m.mileage != null ? ` · ${m.mileage.toLocaleString()} km` : ''}</span></div>
                {m.notes && <p>{m.notes}</p>}
                <small>Registrado por {m.performed_by || 'Usuario'}</small>
              </article>
            ))}
            {generalHistory.length === 0 && <div className="cc-empty-inline">No hay mantenimientos registrados.</div>}
          </div>
        </div>

        <div className="cc-card cc-panel">
          <div className="cc-panel-head"><div><h2>Cambios de aceite</h2><p>{oilHistory.length} registros</p></div></div>
          <div className="cc-timeline">
            {oilHistory.map(entry => {
              const unit = detailValue(entry, 'unit') || 'km';
              const enteredMileage = detailValue(entry, 'entered_mileage') || String(entry.mileage ?? '');
              const nextChange = detailValue(entry, 'next_change_mileage');
              return (
                <article key={entry.id} className="cc-timeline-row">
                  <div><strong>{detailValue(entry, 'oil_type') || entry.maintenance_type}</strong><span>{entry.service_date} · {enteredMileage} {unit}</span></div>
                  <p>{[detailValue(entry, 'brand'), detailValue(entry, 'viscosity')].filter(Boolean).join(' · ')}</p>
                  {nextChange && <small>Próximo cambio: {nextChange} {unit}</small>}
                </article>
              );
            })}
            {oilHistory.length === 0 && <div className="cc-empty-inline">No hay cambios de aceite registrados.</div>}
          </div>
        </div>
      </div>

      <div className="cc-card cc-panel" style={{ marginTop: '16px' }}>
        <div className="cc-panel-head"><div><h2>Historial de kilometraje</h2><p>Lecturas registradas a lo largo del tiempo.</p></div></div>
        <div className="cc-mileage-strip">
          {mileageLogs.map(log => (
            <div key={log.id} className="cc-mileage-chip"><strong>{log.mileage.toLocaleString()} km</strong><span>{new Date(log.recorded_at).toLocaleDateString()}</span>{log.notes && <small>{log.notes}</small>}</div>
          ))}
          {mileageLogs.length === 0 && <div className="cc-empty-inline">No hay registros de kilometraje.</div>}
        </div>
      </div>
    </section>
  );
};

export default VehicleDetails;
