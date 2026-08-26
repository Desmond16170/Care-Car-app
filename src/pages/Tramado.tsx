import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { listVehicles, VehicleRecord } from '../services/carCareData';
import {
  createCustomer,
  createReception,
  CustomerRecord,
  DamageRecord,
  formatReceptionNumber,
  searchCustomers,
  uploadReceptionPhotos,
  upsertReceptionInspection,
} from '../services/tramadoData';

const ACCESSORY_OPTIONS = [
  'Llave principal',
  'Llave secundaria',
  'Documentos',
  'Herramientas',
  'Llanta de repuesto',
  'Gato',
  'Triángulos',
  'Extintor',
  'Radio / estéreo',
  'Objetos personales',
];

const DAMAGE_ZONES = [
  'Frente',
  'Parte trasera',
  'Lado izquierdo',
  'Lado derecho',
  'Techo',
  'Parabrisas',
  'Vidrios',
  'Aros / llantas',
  'Interior',
];

const Tramado = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);

  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', identification: '', phone: '', email: '' });

  const [entry, setEntry] = useState({ mileage: '', fuelLevel: 50, reason: '' });
  const [accessories, setAccessories] = useState<string[]>([]);
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ code: string; photoWarning?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [vehicleRows, customerRows] = await Promise.all([listVehicles(), searchCustomers('')]);
        if (!mounted) return;
        setVehicles(vehicleRows);
        setCustomers(customerRows);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos de recepción.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (customerMode !== 'existing') return;
    const timer = window.setTimeout(() => {
      searchCustomers(customerQuery)
        .then(setCustomers)
        .catch(err => setError(err instanceof Error ? err.message : 'No se pudieron buscar los clientes.'));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [customerMode, customerQuery]);

  const filteredVehicles = useMemo(() => {
    const value = vehicleQuery.trim().toLowerCase();
    const rows = value
      ? vehicles.filter(vehicle => [vehicle.plate, vehicle.make, vehicle.model, vehicle.nickname]
          .filter(Boolean)
          .some(item => String(item).toLowerCase().includes(value)))
      : vehicles;
    return rows.slice(0, 10);
  }, [vehicleQuery, vehicles]);

  const selectVehicle = (vehicle: VehicleRecord) => {
    setSelectedVehicle(vehicle);
    setEntry(current => ({ ...current, mileage: String(vehicle.current_mileage || 0) }));
    setError('');
  };

  const toggleAccessory = (item: string) => {
    setAccessories(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item]);
  };

  const toggleDamage = (zone: string) => {
    setDamages(current => current.some(item => item.zone === zone)
      ? current.filter(item => item.zone !== zone)
      : [...current, { zone, note: '' }]);
  };

  const updateDamageNote = (zone: string, note: string) => {
    setDamages(current => current.map(item => item.zone === zone ? { ...item, note } : item));
  };

  const validateStepOne = () => {
    if (!selectedVehicle) return 'Selecciona el vehículo que está ingresando.';
    if (customerMode === 'existing' && !selectedCustomer) return 'Selecciona un cliente existente.';
    if (customerMode === 'new' && !newCustomer.fullName.trim()) return 'Escribe el nombre del cliente.';
    return '';
  };

  const validateStepTwo = () => {
    const mileage = Number(entry.mileage);
    if (!Number.isFinite(mileage) || mileage < 0) return 'Ingresa un kilometraje válido.';
    if (!entry.reason.trim()) return 'Indica el motivo de ingreso.';
    return '';
  };

  const goNext = () => {
    const validation = step === 1 ? validateStepOne() : validateStepTwo();
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setStep(current => Math.min(3, current + 1));
  };

  const handleSave = async () => {
    if (!selectedVehicle) return;
    const one = validateStepOne();
    const two = validateStepTwo();
    if (one || two) {
      setError(one || two);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const customer = customerMode === 'existing' && selectedCustomer
        ? selectedCustomer
        : await createCustomer({
            fullName: newCustomer.fullName,
            identification: newCustomer.identification,
            phone: newCustomer.phone,
            email: newCustomer.email,
          });

      const reception = await createReception({
        customerId: customer.id,
        vehicleId: selectedVehicle.id,
        mileage: Number(entry.mileage),
        fuelLevel: entry.fuelLevel,
        reason: entry.reason,
      });

      await upsertReceptionInspection({
        receptionId: reception.id,
        accessories,
        damages,
        observations,
      });

      let photoWarning = '';
      if (photos.length > 0) {
        try {
          await uploadReceptionPhotos(reception.id, photos, damages.length > 0 ? 'damage' : 'entry');
        } catch (photoError) {
          photoWarning = photoError instanceof Error
            ? `La recepción quedó guardada, pero hubo un problema con las fotos: ${photoError.message}`
            : 'La recepción quedó guardada, pero algunas fotos no pudieron subirse.';
        }
      }

      setSuccess({ code: formatReceptionNumber(reception.reception_number), photoWarning: photoWarning || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la recepción.');
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setVehicleQuery('');
    setSelectedVehicle(null);
    setCustomerMode('existing');
    setCustomerQuery('');
    setSelectedCustomer(null);
    setNewCustomer({ fullName: '', identification: '', phone: '', email: '' });
    setEntry({ mileage: '', fuelLevel: 50, reason: '' });
    setAccessories([]);
    setDamages([]);
    setObservations('');
    setPhotos([]);
    setError('');
    setSuccess(null);
  };

  if (loading) return <div className="cc-card cc-empty">Preparando recepción...</div>;

  if (success) {
    return (
      <section className="cc-page cc-form-page">
        <div className="cc-card cc-reception-success">
          <span className="cc-action-label">Recepción guardada</span>
          <h1>{success.code}</h1>
          <p>El cliente, vehículo, datos de entrada e inspección quedaron registrados.</p>
          {success.photoWarning && <div className="cc-alert cc-alert-danger">{success.photoWarning}</div>}
          <div className="cc-form-actions">
            <ThemedButton onClick={() => navigate('/dashboard')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Ir al resumen</ThemedButton>
            <ThemedButton onClick={resetFlow} style={{ width: 'auto' }}>Nueva recepción</ThemedButton>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cc-page cc-form-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Recepción del taller</div>
          <h1 className="cc-page-title">Tramado</h1>
          <p className="cc-page-subtitle">Recibe el vehículo y deja documentado cómo entra al taller.</p>
        </div>
        <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>
          Vehículo nuevo
        </ThemedButton>
      </div>

      <div className="cc-stepper">
        {['Cliente y vehículo', 'Entrada', 'Inspección'].map((label, index) => {
          const number = index + 1;
          return <div key={label} className={`cc-step${step === number ? ' current' : step > number ? ' done' : ''}`}><span>{number}</span><strong>{label}</strong></div>;
        })}
      </div>

      {error && <div className="cc-alert cc-alert-danger">{error}</div>}

      <div className="cc-card cc-form-shell">
        {step === 1 && (
          <div className="cc-tramado-columns">
            <div>
              <div className="cc-panel-head"><div><h2>Vehículo</h2><p>Busca por placa, marca, modelo o apodo.</p></div></div>
              <input className="cc-input" type="search" value={vehicleQuery} onChange={e => setVehicleQuery(e.target.value)} placeholder="Buscar vehículo..." />
              <div className="cc-compact-list">
                {filteredVehicles.map(vehicle => (
                  <button key={vehicle.id} className="cc-list-row" onClick={() => selectVehicle(vehicle)} style={selectedVehicle?.id === vehicle.id ? { borderColor: '#efb276', background: '#fff8f1' } : undefined}>
                    <div><strong>{vehicle.plate || 'Sin placa'}</strong><span>{vehicle.make} {vehicle.model}</span></div>
                    <div className="cc-list-row-end"><strong>{vehicle.current_mileage.toLocaleString()} km</strong><span>{selectedVehicle?.id === vehicle.id ? 'Seleccionado' : 'Seleccionar'}</span></div>
                  </button>
                ))}
                {filteredVehicles.length === 0 && <div className="cc-empty-inline">No hay coincidencias.</div>}
              </div>
            </div>

            <div>
              <div className="cc-panel-head"><div><h2>Cliente</h2><p>Solo el nombre es obligatorio para un cliente nuevo.</p></div></div>
              <div className="cc-segmented">
                <button className={customerMode === 'existing' ? 'active' : ''} onClick={() => { setCustomerMode('existing'); setSelectedCustomer(null); }}>Existente</button>
                <button className={customerMode === 'new' ? 'active' : ''} onClick={() => { setCustomerMode('new'); setSelectedCustomer(null); }}>Nuevo</button>
              </div>

              {customerMode === 'existing' ? (
                <>
                  <input className="cc-input" type="search" value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} placeholder="Nombre, identificación, teléfono..." />
                  <div className="cc-compact-list">
                    {customers.map(customer => (
                      <button key={customer.id} className="cc-list-row" onClick={() => setSelectedCustomer(customer)} style={selectedCustomer?.id === customer.id ? { borderColor: '#efb276', background: '#fff8f1' } : undefined}>
                        <div><strong>{customer.full_name}</strong><span>{customer.phone || customer.identification || customer.email || 'Sin datos adicionales'}</span></div>
                        <span className="cc-status active">{selectedCustomer?.id === customer.id ? 'OK' : 'Elegir'}</span>
                      </button>
                    ))}
                    {customers.length === 0 && <div className="cc-empty-inline">No hay clientes. Puedes crear uno nuevo.</div>}
                  </div>
                </>
              ) : (
                <div className="cc-field-grid">
                  <label className="cc-field cc-field-full"><span>Nombre *</span><input className="cc-input" value={newCustomer.fullName} onChange={e => setNewCustomer({ ...newCustomer, fullName: e.target.value })} /></label>
                  <label className="cc-field"><span>Identificación</span><input className="cc-input" value={newCustomer.identification} onChange={e => setNewCustomer({ ...newCustomer, identification: e.target.value })} /></label>
                  <label className="cc-field"><span>Teléfono</span><input className="cc-input" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></label>
                  <label className="cc-field cc-field-full"><span>Correo</span><input className="cc-input" type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} /></label>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="cc-selection-summary"><span>Recepción</span><strong>{selectedVehicle?.plate} · {customerMode === 'existing' ? selectedCustomer?.full_name : newCustomer.fullName}</strong></div>
            <div className="cc-panel-head"><div><h2>Datos de entrada</h2><p>Registra cómo llega el vehículo antes de empezar cualquier trabajo.</p></div></div>
            <div className="cc-field-grid">
              <label className="cc-field"><span>Kilometraje</span><input className="cc-input" type="number" min="0" value={entry.mileage} onChange={e => setEntry({ ...entry, mileage: e.target.value })} /></label>
              <label className="cc-field"><span>Combustible: {entry.fuelLevel}%</span><input className="cc-range" type="range" min="0" max="100" step="5" value={entry.fuelLevel} onChange={e => setEntry({ ...entry, fuelLevel: Number(e.target.value) })} /></label>
              <label className="cc-field cc-field-full"><span>Motivo de ingreso *</span><textarea className="cc-input cc-textarea" value={entry.reason} onChange={e => setEntry({ ...entry, reason: e.target.value })} placeholder="Ej: revisión de frenos, ruido en suspensión, mantenimiento general..." /></label>
            </div>
            <div className="cc-fuel-scale"><span>Vacío</span><span>¼</span><span>½</span><span>¾</span><span>Lleno</span></div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="cc-panel-head"><div><h2>Inspección de entrada</h2><p>Marca lo que se recibe y cualquier daño visible antes del trabajo.</p></div></div>

            <h3 className="cc-section-label">Accesorios / objetos</h3>
            <div className="cc-check-grid">
              {ACCESSORY_OPTIONS.map(item => (
                <button key={item} className={accessories.includes(item) ? 'cc-check-card selected' : 'cc-check-card'} onClick={() => toggleAccessory(item)}>
                  <span>{accessories.includes(item) ? '✓' : '+'}</span>{item}
                </button>
              ))}
            </div>

            <h3 className="cc-section-label">Daños preexistentes</h3>
            <div className="cc-damage-layout">
              <div className="cc-car-diagram" aria-label="Zonas del vehículo">
                {DAMAGE_ZONES.map(zone => (
                  <button key={zone} className={damages.some(item => item.zone === zone) ? 'selected' : ''} onClick={() => toggleDamage(zone)}>{zone}</button>
                ))}
              </div>
              <div className="cc-damage-notes">
                {damages.length === 0 ? <div className="cc-empty-inline">No se han marcado daños visibles.</div> : damages.map(damage => (
                  <label key={damage.zone} className="cc-field"><span>{damage.zone}</span><input className="cc-input" value={damage.note || ''} onChange={e => updateDamageNote(damage.zone, e.target.value)} placeholder="Golpe, rayón, abolladura..." /></label>
                ))}
              </div>
            </div>

            <div className="cc-field-grid" style={{ marginTop: '16px' }}>
              <label className="cc-field cc-field-full"><span>Observaciones</span><textarea className="cc-input cc-textarea" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Cualquier detalle adicional de la recepción" /></label>
              <label className="cc-field cc-field-full"><span>Fotos de entrada</span><input className="cc-file-input" type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files || []))} /><small>Hasta 10 MB por imagen. Se guardan de forma privada.</small></label>
            </div>
            {photos.length > 0 && <div className="cc-photo-list">{photos.map((file, index) => <span key={`${file.name}-${index}`}>{file.name}</span>)}</div>}
          </>
        )}

        <div className="cc-form-actions">
          <ThemedButton onClick={() => step === 1 ? navigate('/1') : setStep(current => current - 1)} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>{step === 1 ? 'Cancelar' : 'Atrás'}</ThemedButton>
          {step < 3 ? (
            <ThemedButton onClick={goNext} style={{ width: 'auto', minWidth: '140px' }}>Continuar</ThemedButton>
          ) : (
            <ThemedButton onClick={handleSave} disabled={saving} style={{ width: 'auto', minWidth: '170px' }}>{saving ? 'Guardando...' : 'Guardar recepción'}</ThemedButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default Tramado;
