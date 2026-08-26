import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import SignaturePad from '../components/SignaturePad';
import VehicleDamageDiagram from '../components/VehicleDamageDiagram';
import PhotoPreviewGrid from '../components/PhotoPreviewGrid';
import { listVehicles, VehicleRecord } from '../services/carCareData';
import {
  createCustomer,
  createReception,
  CustomerRecord,
  DamageRecord,
  formatReceptionNumber,
  saveReceptionSignature,
  searchCustomers,
  uploadReceptionPhotos,
  upsertReceptionInspection,
} from '../services/tramadoData';

const ACCESSORY_OPTIONS = [
  'Llave principal', 'Llave secundaria', 'Documentos', 'Herramientas', 'Llanta de repuesto',
  'Gato', 'Triángulos', 'Extintor', 'Radio / estéreo', 'Objetos personales',
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
  const [delivery, setDelivery] = useState({ estimatedAt: '', customerNotes: '', internalNotes: '' });
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ code: string; warning?: string } | null>(null);

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

  const validateStep = (target = step) => {
    if (target === 1) {
      if (!selectedVehicle) return 'Selecciona el vehículo que está ingresando.';
      if (customerMode === 'existing' && !selectedCustomer) return 'Selecciona un cliente existente.';
      if (customerMode === 'new' && !newCustomer.fullName.trim()) return 'Escribe el nombre del cliente.';
    }
    if (target === 2) {
      const mileage = Number(entry.mileage);
      if (!Number.isFinite(mileage) || mileage < 0) return 'Ingresa un kilometraje válido.';
      if (!entry.reason.trim()) return 'Indica el motivo de ingreso.';
    }
    if (target === 4 && !signatureFile) return 'Solicita la firma del cliente antes de guardar la recepción.';
    return '';
  };

  const goNext = () => {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setStep(current => Math.min(4, current + 1));
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

  const addPhotos = (files: File[]) => {
    const images = files.filter(file => file.type.startsWith('image/'));
    const combined = [...photos, ...images].slice(0, 12);
    setPhotos(combined);
    if (photos.length + images.length > 12) {
      setError('Puedes adjuntar hasta 12 fotografías por recepción.');
    } else {
      setError('');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(current => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSave = async () => {
    if (!selectedVehicle) return;
    const validation = validateStep(1) || validateStep(2) || validateStep(4);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const customer = customerMode === 'existing' && selectedCustomer
        ? selectedCustomer
        : await createCustomer(newCustomer);

      const reception = await createReception({
        customerId: customer.id,
        vehicleId: selectedVehicle.id,
        mileage: Number(entry.mileage),
        fuelLevel: entry.fuelLevel,
        reason: entry.reason,
        estimatedDeliveryAt: delivery.estimatedAt ? new Date(delivery.estimatedAt).toISOString() : undefined,
        customerNotes: delivery.customerNotes,
        internalNotes: delivery.internalNotes,
      });

      await upsertReceptionInspection({ receptionId: reception.id, accessories, damages, observations });

      const warnings: string[] = [];
      if (photos.length) {
        try {
          await uploadReceptionPhotos(reception.id, photos, damages.length ? 'damage' : 'entry');
        } catch (err) {
          warnings.push(`Fotos: ${err instanceof Error ? err.message : 'no se pudieron subir todas'}`);
        }
      }

      if (signatureFile) {
        try {
          await saveReceptionSignature(reception.id, signatureFile);
        } catch (err) {
          warnings.push(`Firma: ${err instanceof Error ? err.message : 'no se pudo guardar'}`);
        }
      }

      setSuccess({ code: formatReceptionNumber(reception.reception_number), warning: warnings.join(' · ') || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la recepción.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cc-card cc-empty">Preparando recepción...</div>;

  if (success) {
    return (
      <section className="cc-page cc-form-page">
        <div className="cc-card cc-reception-success">
          <span className="cc-action-label">Recepción guardada</span>
          <h1>{success.code}</h1>
          <p>La recepción quedó lista para seguimiento e impresión.</p>
          {success.warning && <div className="cc-alert cc-alert-danger">{success.warning}</div>}
          <div className="cc-form-actions">
            <ThemedButton onClick={() => navigate('/recepciones')} style={{ width: 'auto' }}>Ver recepciones</ThemedButton>
            <ThemedButton onClick={() => window.location.reload()} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Nueva recepción</ThemedButton>
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
          <p className="cc-page-subtitle">Recibe el vehículo, documenta su estado y deja la entrega acordada.</p>
        </div>
        <ThemedButton onClick={() => navigate('/recepciones')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Ver recepciones</ThemedButton>
      </div>

      <div className="cc-stepper cc-stepper-four">
        {['Cliente y vehículo', 'Entrada', 'Inspección', 'Entrega y firma'].map((label, index) => {
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
                  <button
                    key={vehicle.id}
                    className="cc-list-row"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setEntry(current => ({ ...current, mileage: String(vehicle.current_mileage || 0) }));
                    }}
                    style={selectedVehicle?.id === vehicle.id ? { borderColor: '#efb276', background: '#fff8f1' } : undefined}
                  >
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
                <button className={customerMode === 'existing' ? 'active' : ''} onClick={() => setCustomerMode('existing')}>Existente</button>
                <button className={customerMode === 'new' ? 'active' : ''} onClick={() => setCustomerMode('new')}>Nuevo</button>
              </div>
              {customerMode === 'existing' ? (
                <>
                  <input className="cc-input" type="search" value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} placeholder="Nombre, identificación, teléfono..." />
                  <div className="cc-compact-list">
                    {customers.map(customer => (
                      <button key={customer.id} className="cc-list-row" onClick={() => setSelectedCustomer(customer)} style={selectedCustomer?.id === customer.id ? { borderColor: '#efb276', background: '#fff8f1' } : undefined}>
                        <div><strong>{customer.full_name}</strong><span>{customer.phone || customer.identification || customer.email || 'Sin datos adicionales'}</span></div>
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
            <div className="cc-panel-head"><div><h2>Datos de entrada</h2><p>Registra cómo llega el vehículo antes de empezar cualquier trabajo.</p></div></div>
            <div className="cc-field-grid">
              <label className="cc-field"><span>Kilometraje</span><input className="cc-input" type="number" min="0" value={entry.mileage} onChange={e => setEntry({ ...entry, mileage: e.target.value })} /></label>
              <label className="cc-field"><span>Combustible: {entry.fuelLevel}%</span><input className="cc-range" type="range" min="0" max="100" step="5" value={entry.fuelLevel} onChange={e => setEntry({ ...entry, fuelLevel: Number(e.target.value) })} /></label>
              <label className="cc-field cc-field-full"><span>Motivo de ingreso *</span><textarea className="cc-input cc-textarea" value={entry.reason} onChange={e => setEntry({ ...entry, reason: e.target.value })} /></label>
            </div>
            <div className="cc-fuel-scale"><span>Vacío</span><span>¼</span><span>½</span><span>¾</span><span>Lleno</span></div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="cc-panel-head"><div><h2>Inspección de entrada</h2><p>Toca las zonas dañadas, describe lo visible y toma fotografías de respaldo.</p></div></div>

            <h3 className="cc-section-label">Accesorios recibidos</h3>
            <div className="cc-check-grid">
              {ACCESSORY_OPTIONS.map(item => (
                <button key={item} className={`cc-check-card${accessories.includes(item) ? ' selected' : ''}`} onClick={() => toggleAccessory(item)}>
                  <span>{accessories.includes(item) ? '✓' : ''}</span>{item}
                </button>
              ))}
            </div>

            <h3 className="cc-section-label">Daños visibles</h3>
            <div className="cc-damage-layout">
              <VehicleDamageDiagram damages={damages} onToggle={toggleDamage} />
              <div className="cc-damage-notes">
                {damages.length === 0 ? (
                  <div className="cc-empty-inline">No hay daños marcados. Toca una zona del vehículo si necesitas registrar uno.</div>
                ) : damages.map(damage => (
                  <label key={damage.zone} className="cc-field cc-damage-note-card">
                    <span>{damage.zone}</span>
                    <input className="cc-input" placeholder="Describe el daño visible" value={damage.note || ''} onChange={e => updateDamageNote(damage.zone, e.target.value)} />
                    <button type="button" className="cc-text-danger" onClick={() => toggleDamage(damage.zone)}>Quitar marca</button>
                  </label>
                ))}
              </div>
            </div>

            <label className="cc-field" style={{ marginTop: 16 }}>
              <span>Observaciones generales</span>
              <textarea className="cc-input cc-textarea" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Estado general, objetos importantes, aclaraciones..." />
            </label>

            <label className="cc-upload-box cc-camera-upload">
              <strong>Fotografías de entrada</strong>
              <span>{photos.length ? `${photos.length} de 12 fotografías` : 'Toma fotos con la cámara o selecciónalas del dispositivo.'}</span>
              <input type="file" accept="image/*" capture="environment" multiple onChange={e => addPhotos(Array.from(e.target.files || []))} />
            </label>
            <PhotoPreviewGrid files={photos} onRemove={removePhoto} />
          </>
        )}

        {step === 4 && (
          <>
            <div className="cc-panel-head"><div><h2>Entrega y conformidad</h2><p>Define la fecha estimada y solicita la firma del cliente.</p></div></div>
            <div className="cc-field-grid">
              <label className="cc-field cc-field-full"><span>Entrega estimada</span><input className="cc-input" type="datetime-local" value={delivery.estimatedAt} onChange={e => setDelivery({ ...delivery, estimatedAt: e.target.value })} /></label>
              <label className="cc-field cc-field-full"><span>Notas para el cliente</span><textarea className="cc-input cc-textarea" value={delivery.customerNotes} onChange={e => setDelivery({ ...delivery, customerNotes: e.target.value })} placeholder="Compromisos, aclaraciones o indicaciones que aparecerán en la recepción." /></label>
              <label className="cc-field cc-field-full"><span>Notas internas</span><textarea className="cc-input cc-textarea" value={delivery.internalNotes} onChange={e => setDelivery({ ...delivery, internalNotes: e.target.value })} placeholder="Solo para el taller." /></label>
            </div>
            <div className="cc-signature-section"><h3>Firma del cliente</h3><p>Confirma que el vehículo se entrega al taller con el estado y accesorios registrados.</p><SignaturePad onChange={setSignatureFile} /></div>
          </>
        )}

        <div className="cc-form-actions">
          <ThemedButton onClick={() => step > 1 ? setStep(step - 1) : navigate('/1')} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>{step > 1 ? 'Atrás' : 'Cancelar'}</ThemedButton>
          {step < 4
            ? <ThemedButton onClick={goNext} style={{ width: 'auto' }}>Continuar</ThemedButton>
            : <ThemedButton onClick={handleSave} disabled={saving} style={{ width: 'auto' }}>{saving ? 'Guardando...' : 'Guardar recepción'}</ThemedButton>}
        </div>
      </div>
    </section>
  );
};

export default Tramado;
