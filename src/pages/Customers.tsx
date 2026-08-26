import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { createCustomer, CustomerRecord, searchCustomers } from '../services/tramadoData';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ fullName: '', identification: '', phone: '', email: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setCustomers(await searchCustomers(''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return customers;
    return customers.filter(customer => [customer.full_name, customer.identification, customer.phone, customer.email]
      .filter(Boolean).some(item => String(item).toLowerCase().includes(value)));
  }, [customers, query]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await createCustomer(form);
      setForm({ fullName: '', identification: '', phone: '', email: '', notes: '' });
      setShowNew(false);
      navigate(`/customers/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el cliente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cc-card cc-empty">Cargando clientes...</div>;

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Directorio</div>
          <h1 className="cc-page-title">Clientes</h1>
          <p className="cc-page-subtitle">Consulta personas, vehículos asociados y visitas al taller.</p>
        </div>
        <ThemedButton onClick={() => setShowNew(current => !current)} style={{ width: 'auto' }}>
          {showNew ? 'Cerrar' : 'Nuevo cliente'}
        </ThemedButton>
      </div>

      {error && <div className="cc-alert cc-alert-danger">{error}</div>}

      {showNew && (
        <form onSubmit={handleCreate} className="cc-card cc-panel" style={{ marginBottom: '16px' }}>
          <div className="cc-panel-head"><div><h2>Registrar cliente</h2><p>Solo el nombre es obligatorio.</p></div></div>
          <div className="cc-field-grid">
            <label className="cc-field cc-field-full"><span>Nombre *</span><input className="cc-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></label>
            <label className="cc-field"><span>Identificación</span><input className="cc-input" value={form.identification} onChange={e => setForm({ ...form, identification: e.target.value })} /></label>
            <label className="cc-field"><span>Teléfono</span><input className="cc-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="cc-field"><span>Correo</span><input className="cc-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label className="cc-field"><span>Notas</span><input className="cc-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <div className="cc-form-actions"><span /><ThemedButton type="submit" disabled={saving} style={{ width: 'auto' }}>{saving ? 'Guardando...' : 'Guardar cliente'}</ThemedButton></div>
        </form>
      )}

      <div className="cc-card cc-panel">
        <input className="cc-input" type="search" placeholder="Buscar por nombre, identificación, teléfono o correo..." value={query} onChange={e => setQuery(e.target.value)} />
        <div className="cc-customer-list">
          {filtered.map(customer => (
            <button className="cc-customer-row" key={customer.id} onClick={() => navigate(`/customers/${customer.id}`)}>
              <div><strong>{customer.full_name}</strong><span>{customer.phone || customer.identification || customer.email || 'Sin datos adicionales'}</span></div>
              <span>Ver ficha</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="cc-empty-inline">No hay clientes que coincidan.</div>}
        </div>
      </div>
    </section>
  );
};

export default Customers;
