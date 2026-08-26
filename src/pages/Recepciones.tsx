import React, { useEffect, useMemo, useState } from 'react';
import ThemedButton from '../components/ThemedButton';
import {
  formatReceptionNumber,
  getPrivateImageUrl,
  getReceptionInspection,
  getReceptionStatusLabel,
  listRecentReceptions,
  ReceptionInspectionRecord,
  ReceptionStatus,
  ReceptionWithDetails,
  updateReceptionStatus,
} from '../services/tramadoData';

const STATUS_FLOW: ReceptionStatus[] = ['received', 'in_progress', 'ready', 'delivered'];

const Recepciones = () => {
  const [rows, setRows] = useState<ReceptionWithDetails[]>([]);
  const [selected, setSelected] = useState<ReceptionWithDetails | null>(null);
  const [inspection, setInspection] = useState<ReceptionInspectionRecord | null>(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReceptionStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listRecentReceptions(100));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las recepciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      if (!selected) {
        setInspection(null);
        setSignatureUrl('');
        return;
      }
      try {
        const result = await getReceptionInspection(selected.id);
        if (active) setInspection(result);
        if (selected.signature_path) {
          const url = await getPrivateImageUrl(selected.signature_path, 600);
          if (active) setSignatureUrl(url);
        } else if (active) {
          setSignatureUrl('');
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo abrir la recepción.');
      }
    };
    void loadDetails();
    return () => { active = false; };
  }, [selected]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return rows.filter(row => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!value) return true;
      return [
        formatReceptionNumber(row.reception_number),
        row.customer?.full_name,
        row.customer?.phone,
        row.vehicle?.plate,
        row.vehicle?.make,
        row.vehicle?.model,
        row.reason,
      ].filter(Boolean).some(item => String(item).toLowerCase().includes(value));
    });
  }, [rows, query, statusFilter]);

  const changeStatus = async (status: ReceptionStatus) => {
    if (!selected || selected.status === status) return;
    setSavingStatus(true);
    setError('');
    try {
      const saved = await updateReceptionStatus(selected.id, status);
      const updated = { ...selected, ...saved };
      setSelected(updated);
      setRows(current => current.map(row => row.id === saved.id ? { ...row, ...saved } : row));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) return <div className="cc-card cc-empty">Cargando recepciones...</div>;

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Operación del taller</div>
          <h1 className="cc-page-title">Recepciones</h1>
          <p className="cc-page-subtitle">Sigue cada vehículo desde que entra hasta que se entrega.</p>
        </div>
      </div>

      {error && <div className="cc-alert cc-alert-danger">{error}</div>}

      <div className="cc-receptions-layout">
        <div className="cc-card cc-panel">
          <div className="cc-reception-toolbar">
            <input className="cc-input" type="search" placeholder="Buscar recepción, cliente o placa..." value={query} onChange={e => setQuery(e.target.value)} />
            <select className="cc-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | ReceptionStatus)}>
              <option value="all">Todos los estados</option>
              <option value="received">Recibidos</option>
              <option value="in_progress">En trabajo</option>
              <option value="ready">Listos</option>
              <option value="delivered">Entregados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

          <div className="cc-reception-list">
            {filtered.map(row => (
              <button key={row.id} className={`cc-reception-row${selected?.id === row.id ? ' selected' : ''}`} onClick={() => setSelected(row)}>
                <div>
                  <strong>{formatReceptionNumber(row.reception_number)}</strong>
                  <span>{row.vehicle?.plate || 'Sin placa'} · {row.customer?.full_name || 'Sin cliente'}</span>
                  <small>{new Date(row.received_at).toLocaleString()}</small>
                </div>
                <span className={`cc-workshop-status ${row.status}`}>{getReceptionStatusLabel(row.status)}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="cc-empty-inline">No hay recepciones que coincidan.</div>}
          </div>
        </div>

        <div className="cc-card cc-panel cc-reception-detail">
          {!selected ? (
            <div className="cc-empty">Selecciona una recepción para verla aquí.</div>
          ) : (
            <>
              <div className="cc-panel-head">
                <div>
                  <span className="cc-action-label">{formatReceptionNumber(selected.reception_number)}</span>
                  <h2 style={{ marginTop: '10px' }}>{selected.vehicle?.plate || 'Sin placa'} · {selected.vehicle?.make} {selected.vehicle?.model}</h2>
                  <p>{selected.customer?.full_name}</p>
                </div>
                <ThemedButton onClick={() => window.print()} style={{ width: 'auto', backgroundColor: '#fff', color: '#4f5a65', border: '1px solid #dfe4e8' }}>Imprimir</ThemedButton>
              </div>

              <div className="cc-status-flow">
                {STATUS_FLOW.map(status => (
                  <button key={status} disabled={savingStatus} className={selected.status === status ? 'active' : ''} onClick={() => void changeStatus(status)}>
                    {getReceptionStatusLabel(status)}
                  </button>
                ))}
              </div>

              <div className="cc-reception-detail-grid">
                <div><span>Kilometraje</span><strong>{selected.mileage.toLocaleString()} km</strong></div>
                <div><span>Combustible</span><strong>{selected.fuel_level}%</strong></div>
                <div><span>Ingreso</span><strong>{new Date(selected.received_at).toLocaleString()}</strong></div>
                <div><span>Entrega estimada</span><strong>{selected.estimated_delivery_at ? new Date(selected.estimated_delivery_at).toLocaleString() : 'Sin definir'}</strong></div>
              </div>

              <div className="cc-reception-section"><h3>Motivo de ingreso</h3><p>{selected.reason}</p></div>
              {selected.customer_notes && <div className="cc-reception-section"><h3>Notas para el cliente</h3><p>{selected.customer_notes}</p></div>}
              {selected.internal_notes && <div className="cc-reception-section"><h3>Notas internas</h3><p>{selected.internal_notes}</p></div>}

              <div className="cc-reception-section">
                <h3>Inspección</h3>
                <p><strong>Accesorios:</strong> {inspection?.accessories?.length ? inspection.accessories.join(', ') : 'Ninguno registrado'}</p>
                <p><strong>Daños:</strong> {inspection?.damages?.length ? inspection.damages.map(item => `${item.zone}${item.note ? ` (${item.note})` : ''}`).join(', ') : 'Sin daños marcados'}</p>
                {inspection?.observations && <p><strong>Observaciones:</strong> {inspection.observations}</p>}
              </div>

              <div className="cc-reception-section">
                <h3>Firma del cliente</h3>
                {signatureUrl ? <img className="cc-signature-preview" src={signatureUrl} alt="Firma del cliente" /> : <p>Sin firma registrada.</p>}
                {selected.signed_at && <small>Firmado: {new Date(selected.signed_at).toLocaleString()}</small>}
              </div>

              <div id="print-area" className="cc-print-receipt">
                <h1>{localStorage.getItem('car-care-taller-name') || 'Care Car'}</h1>
                <h2>Comprobante de recepción {formatReceptionNumber(selected.reception_number)}</h2>
                <p><strong>Cliente:</strong> {selected.customer?.full_name}</p>
                <p><strong>Teléfono:</strong> {selected.customer?.phone || '—'}</p>
                <p><strong>Vehículo:</strong> {selected.vehicle?.plate} · {selected.vehicle?.make} {selected.vehicle?.model}</p>
                <p><strong>Fecha de ingreso:</strong> {new Date(selected.received_at).toLocaleString()}</p>
                <p><strong>Kilometraje:</strong> {selected.mileage.toLocaleString()} km</p>
                <p><strong>Combustible:</strong> {selected.fuel_level}%</p>
                <p><strong>Motivo:</strong> {selected.reason}</p>
                <p><strong>Entrega estimada:</strong> {selected.estimated_delivery_at ? new Date(selected.estimated_delivery_at).toLocaleString() : 'Por definir'}</p>
                <p><strong>Accesorios:</strong> {inspection?.accessories?.length ? inspection.accessories.join(', ') : 'Ninguno'}</p>
                <p><strong>Daños/estado:</strong> {inspection?.damages?.length ? inspection.damages.map(item => `${item.zone}${item.note ? `: ${item.note}` : ''}`).join('; ') : 'Sin daños marcados'}</p>
                {inspection?.observations && <p><strong>Observaciones:</strong> {inspection.observations}</p>}
                {signatureUrl && <div className="cc-print-signature"><img src={signatureUrl} alt="Firma" /><span>Firma del cliente</span></div>}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Recepciones;
