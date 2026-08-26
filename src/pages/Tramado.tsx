import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedButton from '../components/ThemedButton';
import { listVehicles, VehicleRecord } from '../services/carCareData';

const Tramado = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const rows = await listVehicles();
        if (mounted) setVehicles(rows);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'No se pudieron cargar los vehículos.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const filteredVehicles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return vehicles.slice(0, 8);
    return vehicles.filter(vehicle => [vehicle.plate, vehicle.make, vehicle.model, vehicle.nickname]
      .filter(Boolean)
      .some(item => String(item).toLowerCase().includes(value)))
      .slice(0, 8);
  }, [query, vehicles]);

  const steps = [
    ['Cliente y vehículo', 'Buscar un cliente existente o registrar los datos mínimos y asociar el vehículo.'],
    ['Entrada', 'Kilometraje, combustible, motivo de ingreso y fecha/hora de recepción.'],
    ['Accesorios', 'Registrar llaves, documentos, herramientas u objetos entregados con el vehículo.'],
    ['Estado y daños', 'Marcar daños preexistentes en un diagrama y adjuntar fotografías de respaldo.'],
    ['Trabajo y entrega', 'Observaciones, solicitud del cliente y fecha estimada de entrega.'],
    ['Firma y comprobante', 'Firma en pantalla y comprobante imprimible con número consecutivo.'],
  ];

  return (
    <section className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-hero-kicker">Recepción del taller</div>
          <h1 className="cc-page-title">Tramado y recepción</h1>
          <p className="cc-page-subtitle">Un flujo rápido para recibir un vehículo, documentar su estado y dejar todo trazable.</p>
        </div>
        <ThemedButton onClick={() => navigate('/add-vehicle-guided')} style={{ width: 'auto' }}>
          Registrar vehículo nuevo
        </ThemedButton>
      </div>

      <div className="cc-alert cc-alert-info">
        El flujo visual ya queda integrado. El guardado de recepciones, clientes, fotos, firma y consecutivo se conectará a Supabase en la fase funcional de Tramado.
      </div>

      <div className="cc-card cc-panel" style={{ marginBottom: '16px' }}>
        <div className="cc-panel-head">
          <div>
            <h2>1. Selecciona el vehículo</h2>
            <p>Si todavía no existe, regístralo primero y vuelve aquí.</p>
          </div>
        </div>

        <input
          className="cc-input"
          type="search"
          placeholder="Placa, marca, modelo o apodo..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {error && <div className="cc-alert cc-alert-danger" style={{ marginTop: '12px' }}>{error}</div>}
        {loading ? (
          <div className="cc-empty-inline" style={{ marginTop: '12px' }}>Cargando vehículos...</div>
        ) : (
          <div className="cc-compact-list">
            {filteredVehicles.map(vehicle => (
              <button
                key={vehicle.id}
                className="cc-list-row"
                onClick={() => setSelectedVehicle(vehicle)}
                style={selectedVehicle?.id === vehicle.id ? { borderColor: '#efb276', background: '#fff8f1' } : undefined}
              >
                <div>
                  <strong>{vehicle.plate || 'Sin placa'}</strong>
                  <span>{vehicle.make} {vehicle.model}</span>
                </div>
                <div className="cc-list-row-end">
                  <strong>{vehicle.current_mileage.toLocaleString()} km</strong>
                  <span>{selectedVehicle?.id === vehicle.id ? 'Seleccionado' : 'Seleccionar'}</span>
                </div>
              </button>
            ))}
            {!loading && filteredVehicles.length === 0 && (
              <div className="cc-empty-inline">No hay coincidencias.</div>
            )}
          </div>
        )}
      </div>

      {selectedVehicle && (
        <div className="cc-selection-summary" style={{ marginBottom: '16px' }}>
          <span>Vehículo seleccionado</span>
          <strong>{selectedVehicle.plate} · {selectedVehicle.make} {selectedVehicle.model}</strong>
        </div>
      )}

      <div className="cc-tramado-flow">
        {steps.map(([title, copy], index) => (
          <article key={title} className="cc-card cc-tramado-step">
            <div className="cc-tramado-step-number">{index + 1}</div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Tramado;
