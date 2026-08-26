import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import {
  CustomerRecord,
  formatReceptionNumber,
  getCustomer,
  listCustomerReceptions,
  listCustomerVehicles,
  ReceptionRecord,
  updateCustomer,
} from '../services/tramadoData';
import { VehicleRecord } from '../services/carCareData';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [receptions, setReceptions] = useState<ReceptionRecord[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', identification: '', phone: '', email: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const syncForm = (row: CustomerRecord) => setForm({
    fullName: row.full_name,
    identification: row.identification || '',
    phone: row.phone || '',
    email: row.email || '',
    notes: row.notes || '',
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) throw new Error('No se indicó un cliente.');
        const row = await getCustomer(id);
        if (!row) throw new Error('Cliente no encontrado.');
        const [vehicleRows, receptionRows] = await Promise.all([
          listCustomerVehicles(id),
          listCustomerReceptions(id),
        ]);
        if (!mounted) return;
        setCustomer(row);
        syncForm(row);
        setVehicles(vehicleRows);
        setReceptions(receptionRows);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'No se pudo cargar el cliente.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await updateCustomer(customer.id, form);
      setCustomer(saved);
      syncForm(saved);
      setEditing(false);
      setMessage('Cliente actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cc-card cc-empty">Cargando cliente...</div>;
  if (error && !customer) return <div className="cc-alert cc-alert-danger">{error}</div>;
  if (!customer) return null;

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Ficha de cliente</div>
          <h1 className="cc-page-title">{customer.full_name}</h1>
          <p className="cc-page-subtitle">{customer.phone || customer.email || customer.identification || 'Sin datos de contacto adicionales'}</p>
        </div>
        <div className="cc-header-actions">
          <ThemedButton onClick={() => window.print()} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Imprimir</ThemedButton>
          <ThemedButton onClick={() => setEditing(current => !current)} style={{ width: 'auto' }}>{editing ? 'Cerrar edición' : 'Editar'}</ThemedButton>
        </div>
      </div>

      {error && <div className="cc-alert cc-alert-danger">{error}</div>}
      {message && <div className="cc-alert cc-alert-info">{message}</div>}

      {editing ? (
        <form onSubmit={handleSave} className="cc-card cc-panel">
          <div className="cc-field-grid">
            <label className="cc-field cc-field-full"><span>Nombre *</span><input className="cc-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></label>
            <label className="cc-field"><span>Identificación</span><input className="cc-input" value={form.identification} onChange={e => setForm({ ...form, identification: e.target.value })} /></label>
            <label className="cc-field"><span>Teléfono</span><input className="cc-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="cc-field"><span>Correo</span><input className="cc-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label className="cc-field"><span>Notas</span><input className="cc-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <div className="cc-form-actions"><ThemedButton type="button" onClick={() => { syncForm(customer); setEditing(false); }} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Cancelar</ThemedButton><ThemedButton type="submit" disabled={saving} style={{ width: 'auto' }}>{saving ? 'Guardando...' : 'Guardar cambios'}</ThemedButton></div>
        </form>
      ) : (
        <div className="cc-customer-summary-grid">
          <div className="cc-card cc-panel"><h2>Datos</h2><div className="cc-detail-meta-grid"><div><span>Identificación</span><strong>{customer.identification || '—'}</strong></div><div><span>Teléfono</span><strong>{customer.phone || '—'}</strong></div><div><span>Correo</span><strong>{customer.email || '—'}</strong></div><div><span>Notas</span><strong>{customer.notes || '—'}</strong></div></div></div>
          <div className="cc-card cc-panel"><h2>Resumen</h2><div className="cc-detail-meta-grid"><div><span>Vehículos</span><strong>{vehicles.length}</strong></div><div><span>Visitas</span><strong>{receptions.length}</strong></div><div><span>Cliente desde</span><strong>{new Date(customer.created_at).toLocaleDateString()}</strong></div></div></div>
        </div>
      )}

      <div className="cc-history-grid" style={{ marginTop: '16px' }}>
        <div className="cc-card cc-panel">
          <div className="cc-panel-head"><div><h2>Vehículos asociados</h2><p>{vehicles.length} registrados</p></div></div>
          <div className="cc-compact-list">
            {vehicles.map(vehicle => <button key={vehicle.id} className="cc-list-row" onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.plate || '')}`)}><div><strong>{vehicle.plate || 'Sin placa'}</strong><span>{vehicle.make} {vehicle.model}</span></div><div className="cc-list-row-end"><strong>{vehicle.current_mileage.toLocaleString()} km</strong><span>Ver vehículo</span></div></button>)}
            {vehicles.length === 0 && <div className="cc-empty-inline">Todavía no hay vehículos asociados.</div>}
          </div>
        </div>

        <div className="cc-card cc-panel">
          <div className="cc-panel-head"><div><h2>Visitas al taller</h2><p>{receptions.length} recepciones</p></div></div>
          <div className="cc-timeline">
            {receptions.map(reception => <article key={reception.id} className="cc-timeline-row"><div><strong>{formatReceptionNumber(reception.reception_number)}</strong><span>{new Date(reception.received_at).toLocaleDateString()}</span></div><p>{reception.reason}</p><small>{reception.status.replace('_', ' ')} · {reception.mileage.toLocaleString()} km</small></article>)}
            {receptions.length === 0 && <div className="cc-empty-inline">Todavía no hay visitas registradas.</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerDetails;
